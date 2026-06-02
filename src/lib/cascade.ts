// Cross-store cascades — keeps demo coherent
// Each helper writes the primary effect + audit + notifications

import {
  useAcademicStore, useUsersStore, useAccessStore, useCommStore, useFinanceStore, usePlacementStore,
} from "@/stores";
import type {
  AttendanceRecord, LedgerEntry, Notification, AuditEntry, AccessRequest, Drive, Company,
} from "@/lib/types";

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

  const allRecords = [...useAcademicStore.getState().attendance];
  const sectionStudents = users.filter(u => u.role === "student" && u.sectionId === record.sectionId);
  for (const stu of sectionStudents) {
    let total = 0, present = 0;
    for (const r of allRecords.filter(r => r.sectionId === stu.sectionId)) {
      if (r.marks[stu.id]) { total++; if (r.marks[stu.id] === "P" || r.marks[stu.id] === "ML") present++; }
    }
    const pct = total ? Math.round((present / total) * 100) : stu.attendancePct ?? 0;
    if (pct !== stu.attendancePct) updateUser(stu.id, { attendancePct: pct });
  }

  for (const [studentId, mark] of Object.entries(record.marks)) {
    if (mark === "A") {
      const stu = users.find(u => u.id === studentId);
      const parent = users.find(u => u.role === "parent" && u.childId === studentId);
      if (parent && stu) pushNotification({ userId: parent.id, type: "todo", title: `${stu.firstName} marked absent in ${subject?.code ?? "class"}`, meta: `${record.date} · Slot ${record.slot}`, route: "/dashboard" });
      if (stu) pushNotification({ userId: stu.id, type: "recent", title: `Marked absent in ${subject?.name ?? "class"}`, meta: `${record.date} · Slot ${record.slot}`, route: "/dashboard" });
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
    balance: Math.max(lastBalance - amount, 0), reason: `Paid via ${mode}`,
  };
  useFinanceStore.getState().addLedger(entry);

  const users = useUsersStore.getState().users;
  const stu = users.find(u => u.id === studentId);
  const parent = users.find(u => u.role === "parent" && u.childId === studentId);
  if (stu) pushNotification({ userId: stu.id, type: "recent", title: `Fee payment received`, meta: `₹${amount.toLocaleString("en-IN")} via ${mode}`, route: "/my/fees" });
  if (parent) pushNotification({ userId: parent.id, type: "recent", title: `Fee paid for ${stu?.firstName ?? "your child"}`, meta: `₹${amount.toLocaleString("en-IN")} · ${mode}`, route: "/dashboard" });
  pushAudit({ actorId, targetId: studentId, module: "Finance", action: `Fee payment of ₹${amount.toLocaleString("en-IN")}`, reason: `Mode: ${mode}` });
  return entry;
};

// ─── W10: Publish results cascade ────────────────────────────────────────
export const publishResultsCascade = (sectionId: string, examName: string, actorId: string) => {
  const users = useUsersStore.getState().users;
  const students = users.filter(u => u.role === "student" && u.sectionId === sectionId);
  for (const stu of students) {
    pushNotification({ userId: stu.id, type: "todo", title: `${examName} results published`, meta: `Tap to view your grade card`, route: "/my/results" });
    const parent = users.find(u => u.role === "parent" && u.childId === stu.id);
    if (parent) pushNotification({ userId: parent.id, type: "todo", title: `${stu.firstName}'s ${examName} results are out`, meta: `Grade card available`, route: "/dashboard" });
  }
  pushAudit({ actorId, module: "Examinations", action: `Published ${examName} results for ${sectionId}`, reason: `${students.length} students notified` });
};

// ─── NAD push cascade ───────────────────────────────────────────────────
export const nadPushCascade = (sectionId: string, examName: string, actorId: string) => {
  const students = useUsersStore.getState().users.filter(u => u.role === "student" && u.sectionId === sectionId);
  for (const stu of students) {
    pushNotification({ userId: stu.id, type: "recent", title: `Grade card pushed to DigiLocker`, meta: `${examName} · Available in NAD`, route: "/my/results" });
  }
  pushAudit({ actorId, module: "Examinations", action: `NAD push: ${examName} for ${sectionId}`, reason: `${students.length} grade cards pushed` });
};

// ─── Access request raised ──────────────────────────────────────────────
export const requestAccessCascade = (userId: string, targetRoute: string) => {
  useAccessStore.getState().addRequest({
    id: uid("req"), userId, requestedBy: userId, requestedAt: new Date().toISOString(),
    change: `Access to ${targetRoute}`, reason: "Requested via Access Denied page", status: "pending",
  });
  pushAudit({ actorId: userId, module: "Access Control", action: `Access request raised for ${targetRoute}` });
};

// ─── HOI: approve/reject access request ─────────────────────────────────
export const resolveAccessRequestCascade = (
  requestId: string, decision: "approved" | "rejected", comment: string, actorId: string,
) => {
  const req = useAccessStore.getState().requests.find(r => r.id === requestId);
  useAccessStore.getState().resolveRequest(requestId, decision, comment, actorId);
  if (!req) return;
  const target = useUsersStore.getState().users.find(u => u.id === req.userId);
  pushNotification({
    userId: req.userId, type: decision === "approved" ? "recent" : "awaiting",
    title: decision === "approved" ? "Access change approved" : "Access request rejected",
    meta: req.change, route: "/admin/access-control/requests",
  });
  pushAudit({
    actorId, targetId: req.userId, module: "Access Control",
    action: `${decision === "approved" ? "Approved" : "Rejected"} access change for ${target?.firstName ?? req.userId}`,
    reason: comment || req.reason,
  });
};

// ─── Registrar: verify documents (DigiLocker / manual) ──────────────────
export const verifyDocumentsCascade = (studentId: string, source: "DigiLocker" | "Manual", actorId: string) => {
  const stu = useUsersStore.getState().users.find(u => u.id === studentId);
  useUsersStore.getState().updateUser(studentId, { needsReview: false });
  if (stu) pushNotification({ userId: stu.id, type: "recent", title: `Documents verified`, meta: `Source: ${source}`, route: "/profile" });
  pushAudit({ actorId, targetId: studentId, module: "Documents", action: `Verified documents via ${source}`, reason: stu ? `${stu.firstName} ${stu.lastName}` : studentId });
};

// ─── Registrar: certificate issued ──────────────────────────────────────
export const issueCertificateCascade = (studentId: string, certType: string, actorId: string) => {
  const stu = useUsersStore.getState().users.find(u => u.id === studentId);
  if (stu) pushNotification({ userId: stu.id, type: "todo", title: `${certType} issued`, meta: `Available in your Documents tab`, route: "/profile" });
  pushAudit({ actorId, targetId: studentId, module: "Documents", action: `Issued ${certType}`, reason: stu ? `${stu.firstName} ${stu.lastName}` : studentId });
};

// ─── Registrar: scholarship verified → finance queue ────────────────────
export const verifyScholarshipCascade = (studentId: string, scheme: string, actorId: string) => {
  const stu = useUsersStore.getState().users.find(u => u.id === studentId);
  if (stu) pushNotification({ userId: stu.id, type: "recent", title: `Scholarship verified`, meta: `${scheme} · Pending disbursement`, route: "/my/fees" });
  // Notify finance head
  const finance = useUsersStore.getState().users.find(u => u.role === "finance_head");
  if (finance) pushNotification({ userId: finance.id, type: "todo", title: `Scholarship to disburse`, meta: `${stu?.firstName ?? studentId} · ${scheme}`, route: "/finance/scholarships" });
  pushAudit({ actorId, targetId: studentId, module: "Scholarships", action: `Verified scholarship: ${scheme}` });
};

// ─── Registrar: approve admission ───────────────────────────────────────
export const approveAdmissionCascade = (applicantName: string, program: string, actorId: string) => {
  // Notify HOD of program's department
  const hods = useUsersStore.getState().users.filter(u => u.role === "hod");
  hods.slice(0, 1).forEach(h => pushNotification({
    userId: h.id, type: "recent", title: `New enrolment in ${program}`,
    meta: applicantName, route: "/people/students",
  }));
  pushAudit({ actorId, module: "Admissions", action: `Approved enrolment: ${applicantName} → ${program}`, reason: "Documents verified, fees paid" });
};

// ─── Finance: approve refund ────────────────────────────────────────────
export const approveRefundCascade = (studentId: string, amount: number, actorId: string) => {
  const stu = useUsersStore.getState().users.find(u => u.id === studentId);
  if (stu) pushNotification({ userId: stu.id, type: "awaiting", title: `Refund approved`, meta: `₹${amount.toLocaleString("en-IN")} · Pending bank transfer`, route: "/my/fees" });
  pushAudit({ actorId, targetId: studentId, module: "Finance", action: `Approved refund ₹${amount.toLocaleString("en-IN")}` });
};

// ─── Finance: process refund (bank transfer complete) ───────────────────
export const processRefundCascade = (studentId: string, amount: number, utr: string, actorId: string) => {
  const ledger = useFinanceStore.getState().ledger;
  const last = ledger.find(l => l.studentId === studentId);
  const balance = (last?.balance ?? 0);
  useFinanceStore.getState().addLedger({
    id: uid("led"), studentId, date: new Date().toISOString().slice(0, 10),
    head: "Refund", refund: amount, balance, reason: `UTR ${utr}`,
  });
  const stu = useUsersStore.getState().users.find(u => u.id === studentId);
  const parent = useUsersStore.getState().users.find(u => u.role === "parent" && u.childId === studentId);
  if (stu) pushNotification({ userId: stu.id, type: "recent", title: `Refund transferred`, meta: `₹${amount.toLocaleString("en-IN")} · UTR ${utr}`, route: "/my/fees" });
  if (parent) pushNotification({ userId: parent.id, type: "recent", title: `Refund received`, meta: `₹${amount.toLocaleString("en-IN")} · ${stu?.firstName ?? "child"}`, route: "/dashboard" });
  pushAudit({ actorId, targetId: studentId, module: "Finance", action: `Refund processed ₹${amount.toLocaleString("en-IN")}`, reason: `UTR ${utr}` });
};

// ─── Finance: approve waiver ────────────────────────────────────────────
export const approveWaiverCascade = (studentId: string, pct: number, actorId: string) => {
  const stu = useUsersStore.getState().users.find(u => u.id === studentId);
  const ledger = useFinanceStore.getState().ledger;
  const last = ledger.find(l => l.studentId === studentId);
  const balance = (last?.balance ?? 60000);
  const waiverAmount = Math.round(balance * pct / 100);
  useFinanceStore.getState().addLedger({
    id: uid("led"), studentId, date: new Date().toISOString().slice(0, 10),
    head: `Fee Waiver (${pct}%)`, waiver: waiverAmount, balance: Math.max(balance - waiverAmount, 0),
    reason: `Approved by Finance Head`,
  });
  if (stu) pushNotification({ userId: stu.id, type: "recent", title: `Fee waiver approved`, meta: `${pct}% · ₹${waiverAmount.toLocaleString("en-IN")} credited`, route: "/my/fees" });
  pushAudit({ actorId, targetId: studentId, module: "Finance", action: `Approved ${pct}% waiver`, reason: `Saved ₹${waiverAmount.toLocaleString("en-IN")}` });
};

// ─── Finance: send fee reminder ─────────────────────────────────────────
export const sendFeeReminderCascade = (studentId: string, channels: string[], actorId: string) => {
  const stu = useUsersStore.getState().users.find(u => u.id === studentId);
  const parent = useUsersStore.getState().users.find(u => u.role === "parent" && u.childId === studentId);
  const msg = `Fee dues pending. Please clear within 5 days.`;
  if (stu) pushNotification({ userId: stu.id, type: "awaiting", title: `Fee reminder`, meta: msg, route: "/my/fees" });
  if (parent) pushNotification({ userId: parent.id, type: "awaiting", title: `Fee reminder for ${stu?.firstName ?? "your child"}`, meta: msg, route: "/dashboard" });
  pushAudit({ actorId, targetId: studentId, module: "Finance", action: `Sent fee reminder via ${channels.join(", ")}` });
};

// ─── Finance: block exam access ─────────────────────────────────────────
export const blockExamAccessCascade = (studentId: string, actorId: string) => {
  useUsersStore.getState().updateUser(studentId, { needsReview: true });
  const stu = useUsersStore.getState().users.find(u => u.id === studentId);
  const parent = useUsersStore.getState().users.find(u => u.role === "parent" && u.childId === studentId);
  if (stu) pushNotification({ userId: stu.id, type: "awaiting", title: `Exam access blocked`, meta: `Clear fee dues to regenerate hall ticket`, route: "/my/fees" });
  if (parent) pushNotification({ userId: parent.id, type: "todo", title: `Action required`, meta: `${stu?.firstName ?? "child"} exam access blocked due to dues`, route: "/dashboard" });
  pushAudit({ actorId, targetId: studentId, module: "Finance", action: `Blocked exam access due to fee dues` });
};

// ─── Finance: disburse scholarship batch ────────────────────────────────
export const disburseScholarshipCascade = (count: number, amountEach: number, actorId: string) => {
  pushAudit({ actorId, module: "Scholarships", action: `Disbursed scholarships to ${count} students`, reason: `₹${amountEach.toLocaleString("en-IN")} each · Total ₹${(count * amountEach).toLocaleString("en-IN")}` });
};

// ─── Exam Cell: override eligibility ────────────────────────────────────
export const overrideEligibilityCascade = (studentId: string, approve: boolean, reason: string, actorId: string) => {
  const stu = useUsersStore.getState().users.find(u => u.id === studentId);
  if (approve) useUsersStore.getState().updateUser(studentId, { needsReview: false });
  if (stu) pushNotification({
    userId: stu.id,
    type: approve ? "recent" : "awaiting",
    title: approve ? `Exam eligibility restored` : `Eligibility override denied`,
    meta: approve ? `Hall ticket regenerated` : reason,
    route: "/my/results",
  });
  pushAudit({ actorId, targetId: studentId, module: "Examinations", action: `${approve ? "Approved" : "Denied"} eligibility override`, reason });
};

// ─── Exam Cell: lock marks ──────────────────────────────────────────────
export const lockMarksCascade = (sectionId: string, examName: string, subject: string, actorId: string) => {
  pushAudit({ actorId, module: "Examinations", action: `Locked ${subject} marks for ${examName}`, reason: `Section ${sectionId}` });
  const examHead = useUsersStore.getState().users.find(u => u.role === "exam_head");
  if (examHead) pushNotification({ userId: examHead.id, type: "todo", title: `${subject} marks ready for publish`, meta: `${examName} · ${sectionId}`, route: "/academic/examinations" });
};

// ─── TPO: review AI interview ───────────────────────────────────────────
export const reviewAiInterviewCascade = (studentId: string, scoreOverride: number, actorId: string) => {
  const stu = useUsersStore.getState().users.find(u => u.id === studentId);
  if (stu) pushNotification({ userId: stu.id, type: "recent", title: `AI interview reviewed`, meta: `Final score: ${scoreOverride}/100`, route: "/placement/ai-interviews" });
  pushAudit({ actorId, targetId: studentId, module: "Placement", action: `Reviewed AI interview`, reason: `Final score ${scoreOverride}/100` });
};

// ─── TPO: send drive reminder ───────────────────────────────────────────
export const sendDriveReminderCascade = (driveId: string, channels: string[], actorId: string) => {
  const drive = usePlacementStore.getState().drives.find(d => d.id === driveId);
  const company = usePlacementStore.getState().companies.find(c => c.id === drive?.companyId);
  // Notify all eligible students who haven't applied
  const students = useUsersStore.getState().users.filter(u => u.role === "student").slice(0, 25);
  students.forEach(s => pushNotification({
    userId: s.id, type: "todo",
    title: `Reminder: Apply for ${company?.name ?? "drive"}`,
    meta: `Drive closes soon · ${drive?.role ?? ""}`,
    route: `/placement/drives/${driveId}`,
  }));
  pushAudit({ actorId, module: "Placement", action: `Sent drive reminder for ${company?.name ?? driveId}`, reason: `Channels: ${channels.join(", ")}` });
};

// ─── TPO: nudge inactive student ────────────────────────────────────────
export const sendNudgeCascade = (studentId: string, channels: string[], actorId: string) => {
  const stu = useUsersStore.getState().users.find(u => u.id === studentId);
  if (stu) pushNotification({ userId: stu.id, type: "todo", title: `Practice nudge`, meta: `Complete your assigned MCQ practice this week`, route: "/placement/ai-assessments" });
  pushAudit({ actorId, targetId: studentId, module: "Placement", action: `Nudged inactive student via ${channels.join(", ")}` });
};

// ─── TPO: create drive ──────────────────────────────────────────────────
export const createDriveCascade = (drive: Drive, actorId: string) => {
  usePlacementStore.getState().addDrive(drive);
  const company = usePlacementStore.getState().companies.find(c => c.id === drive.companyId);
  // Notify all students
  const students = useUsersStore.getState().users.filter(u => u.role === "student").slice(0, 40);
  students.forEach(s => pushNotification({
    userId: s.id, type: "todo", title: `New drive: ${company?.name ?? "Company"}`,
    meta: `${drive.role} · ${drive.package}`, route: `/placement/drives/${drive.id}`,
  }));
  pushAudit({ actorId, module: "Placement", action: `Created drive: ${company?.name ?? drive.companyId} — ${drive.role}` });
};

// ─── HOD: send department alert ─────────────────────────────────────────
export const sendDeptAlertCascade = (deptId: string, message: string, actorId: string) => {
  const hod = useUsersStore.getState().users.find(u => u.role === "hod" && u.department === deptId);
  if (hod) pushNotification({ userId: hod.id, type: "todo", title: `Director alert`, meta: message, route: "/dashboard" });
  pushAudit({ actorId, module: "Communications", action: `Sent department alert to ${deptId}`, reason: message });
};

// ─── Faculty: upload study material ─────────────────────────────────────
export const uploadMaterialCascade = (sectionId: string, subjectCode: string, fileName: string, actorId: string) => {
  const students = useUsersStore.getState().users.filter(u => u.role === "student" && u.sectionId === sectionId);
  students.forEach(s => pushNotification({
    userId: s.id, type: "todo", title: `New ${subjectCode} material`,
    meta: fileName, route: "/academic/study-material",
  }));
  pushAudit({ actorId, module: "Study Material", action: `Uploaded ${fileName}`, reason: `${subjectCode} · ${sectionId}` });
};

// ─── Parent: WhatsApp opt-in ────────────────────────────────────────────
export const optInWhatsappCascade = (parentId: string) => {
  useUsersStore.getState().updateUser(parentId, { loginMethod: "otp" });
  pushNotification({ userId: parentId, type: "recent", title: `WhatsApp alerts enabled`, meta: `You'll receive attendance, fee, and result updates`, route: "/dashboard" });
  pushAudit({ actorId: parentId, module: "Communications", action: `Opted in to WhatsApp alerts` });
};
