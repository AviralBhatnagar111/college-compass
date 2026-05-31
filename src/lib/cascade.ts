// Cross-store cascades — keeps demo coherent
// Each helper writes the primary effect + audit + notifications

import {
  useAcademicStore, useUsersStore, useAccessStore, useCommStore, useFinanceStore,
} from "@/stores";
import type { AttendanceRecord, LedgerEntry, Notification, AuditEntry } from "@/lib/types";

const uid = (p: string) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

const pushAudit = (entry: Omit<AuditEntry, "id" | "at">) => {
  useAccessStore.getState().addAudit({ ...entry, id: uid("aud"), at: new Date().toISOString() });
};

const pushNotification = (n: Omit<Notification, "id" | "createdAt">) => {
  useCommStore.getState().addNotification({ ...n, id: uid("ntf"), createdAt: new Date().toISOString() });
};

// ─── W1: Faculty marks attendance ────────────────────────────────────────
export const saveAttendanceCascade = (record: AttendanceRecord, actorId: string) => {
  useAcademicStore.getState().saveAttendance(record);

  const users = useUsersStore.getState().users;
  const updateUser = useUsersStore.getState().updateUser;
  const subject = useAcademicStore.getState().subjects.find(s => s.id === record.subjectId);

  // Recompute attendance % per student for this section across all records
  const allRecords = [...useAcademicStore.getState().attendance];
  const sectionStudents = users.filter(u => u.role === "student" && u.sectionId === record.sectionId);
  for (const stu of sectionStudents) {
    let total = 0, present = 0;
    for (const r of allRecords.filter(r => r.sectionId === stu.sectionId)) {
      if (r.marks[stu.id]) {
        total++;
        if (r.marks[stu.id] === "P" || r.marks[stu.id] === "ML") present++;
      }
    }
    const pct = total ? Math.round((present / total) * 100) : stu.attendancePct ?? 0;
    if (pct !== stu.attendancePct) updateUser(stu.id, { attendancePct: pct });
  }

  // Notify parents of absent students
  for (const [studentId, mark] of Object.entries(record.marks)) {
    if (mark === "A") {
      const stu = users.find(u => u.id === studentId);
      const parent = users.find(u => u.role === "parent" && u.childId === studentId);
      if (parent && stu) {
        pushNotification({
          userId: parent.id, type: "todo",
          title: `${stu.firstName} marked absent in ${subject?.code ?? "class"}`,
          meta: `${record.date} · Slot ${record.slot}`,
          route: "/dashboard",
        });
      }
      if (stu) {
        pushNotification({
          userId: stu.id, type: "recent",
          title: `Marked absent in ${subject?.name ?? "class"}`,
          meta: `${record.date} · Slot ${record.slot}`,
          route: "/dashboard",
        });
      }
    }
  }

  pushAudit({
    actorId, module: "Attendance",
    action: `Marked attendance for ${record.sectionId} · ${subject?.code ?? record.subjectId}`,
    reason: `${Object.values(record.marks).filter(v => v === "P").length}/${Object.keys(record.marks).length} present`,
  });
};

// ─── W9: Fee payment cascade ─────────────────────────────────────────────
export const payFeeCascade = (studentId: string, amount: number, mode: string, actorId: string) => {
  const ledger = useFinanceStore.getState().ledger;
  const studentLedger = ledger.filter(l => l.studentId === studentId);
  const lastBalance = studentLedger[0]?.balance ?? 60000;
  const entry: LedgerEntry = {
    id: uid("led"), studentId, date: new Date().toISOString().slice(0, 10),
    head: "Tuition Fee — Sem 5 Installment 2", payment: amount,
    balance: Math.max(lastBalance - amount, 0),
    reason: `Paid via ${mode}`,
  };
  useFinanceStore.getState().addLedger(entry);

  const users = useUsersStore.getState().users;
  const stu = users.find(u => u.id === studentId);
  const parent = users.find(u => u.role === "parent" && u.childId === studentId);
  if (stu) pushNotification({
    userId: stu.id, type: "recent",
    title: `Fee payment received`,
    meta: `₹${amount.toLocaleString("en-IN")} via ${mode}`,
    route: "/my/fees",
  });
  if (parent) pushNotification({
    userId: parent.id, type: "recent",
    title: `Fee paid for ${stu?.firstName ?? "your child"}`,
    meta: `₹${amount.toLocaleString("en-IN")} · ${mode}`,
    route: "/dashboard",
  });
  pushAudit({
    actorId, targetId: studentId, module: "Finance",
    action: `Fee payment of ₹${amount.toLocaleString("en-IN")}`,
    reason: `Mode: ${mode}`,
  });
  return entry;
};

// ─── W10: Publish results cascade ────────────────────────────────────────
export const publishResultsCascade = (sectionId: string, examName: string, actorId: string) => {
  const users = useUsersStore.getState().users;
  const students = users.filter(u => u.role === "student" && u.sectionId === sectionId);

  for (const stu of students) {
    pushNotification({
      userId: stu.id, type: "todo",
      title: `${examName} results published`,
      meta: `Tap to view your grade card`,
      route: "/my/results",
    });
    const parent = users.find(u => u.role === "parent" && u.childId === stu.id);
    if (parent) pushNotification({
      userId: parent.id, type: "todo",
      title: `${stu.firstName}'s ${examName} results are out`,
      meta: `Grade card available`,
      route: "/dashboard",
    });
  }
  pushAudit({
    actorId, module: "Examinations",
    action: `Published ${examName} results for ${sectionId}`,
    reason: `${students.length} students notified`,
  });
};

// ─── NAD push cascade ───────────────────────────────────────────────────
export const nadPushCascade = (sectionId: string, examName: string, actorId: string) => {
  const students = useUsersStore.getState().users.filter(u => u.role === "student" && u.sectionId === sectionId);
  for (const stu of students) {
    pushNotification({
      userId: stu.id, type: "recent",
      title: `Grade card pushed to DigiLocker`,
      meta: `${examName} · Available in NAD`,
      route: "/my/results",
    });
  }
  pushAudit({
    actorId, module: "Examinations",
    action: `NAD push: ${examName} for ${sectionId}`,
    reason: `${students.length} grade cards pushed`,
  });
};

// ─── Access request creation (for Access Denied page) ───────────────────
export const requestAccessCascade = (userId: string, targetRoute: string) => {
  useAccessStore.getState().addRequest({
    id: uid("req"), userId, requestedBy: userId,
    requestedAt: new Date().toISOString(),
    change: `Access to ${targetRoute}`,
    reason: "Requested via Access Denied page",
    status: "pending",
  });
  pushAudit({
    actorId: userId, module: "Access Control",
    action: `Access request raised for ${targetRoute}`,
  });
};
