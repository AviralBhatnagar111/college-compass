import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAcademicStore, useUsersStore, useAccessStore } from "@/stores";
import { useAttendanceWorkflow, slotTime, type AttendanceSubmission, type SubmissionStatus, type CorrectionType } from "@/stores/attendanceWorkflow";
import { useAccess } from "@/lib/access";
import { saveAttendanceCascade } from "@/lib/cascade";
import {
  Check, X, Clock, ClipboardCheck, Save, Eye, TrendingUp, AlertTriangle,
  Download, FileText, CalendarDays, MessageSquare, ThumbsUp, ThumbsDown, Users,
  Undo2, Lock,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";
import { KpiCard } from "@/components/common/KpiCard";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "sonner";
import type { User } from "@/lib/types";

export const Route = createFileRoute("/_app/academic/attendance")({
  head: () => ({ meta: [{ title: "Attendance — LearnNowX" }] }),
  component: AttendancePage,
});

type Mark = "P" | "A" | "L" | "ML";
const MARKS: Mark[] = ["P", "A", "L", "ML"];
const markLabel: Record<Mark, string> = { P: "Present", A: "Absent", L: "Leave", ML: "Medical" };
const markStyle: Record<Mark, string> = {
  P: "bg-lnx-green-500 text-white border-lnx-green-500",
  A: "bg-lnx-red-500 text-white border-lnx-red-500",
  L: "bg-lnx-amber-500 text-white border-lnx-amber-500",
  ML: "bg-lnx-navy-800 text-white border-lnx-navy-800",
};

const attendanceBadge = (v: number) =>
  v >= 80 ? "bg-lnx-green-500/10 text-lnx-green-500"
  : v >= 75 ? "bg-lnx-teal-500/10 text-lnx-teal-600"
  : v >= 65 ? "bg-lnx-amber-500/10 text-lnx-amber-500"
  : "bg-lnx-red-500/10 text-lnx-red-500";

const statusStyle: Record<SubmissionStatus, string> = {
  draft:     "bg-muted text-muted-foreground",
  pending:   "bg-lnx-amber-500/10 text-lnx-amber-500",
  approved:  "bg-lnx-green-500/10 text-lnx-green-500",
  rejected:  "bg-lnx-red-500/10 text-lnx-red-500",
  returned:  "bg-lnx-amber-500/10 text-lnx-amber-500",
  corrected: "bg-lnx-teal-500/10 text-lnx-teal-600",
  locked:    "bg-lnx-navy-800/10 text-lnx-navy-800",
};
const statusLabel: Record<SubmissionStatus, string> = {
  draft: "Draft", pending: "Pending Approval", approved: "Approved",
  rejected: "Rejected", returned: "Returned", corrected: "Corrected", locked: "Locked",
};

function AttendancePage() {
  const { user } = useAccess();
  if (!user) return null;
  switch (user.role) {
    case "hoi": return <ExecutiveView role="hoi" />;
    case "registrar": return <ExecutiveView role="registrar" />;
    case "exam_head": return <ExecutiveView role="registrar" />;
    case "hod": return <HodView />;
    case "faculty": return <FacultyView isLab={false} />;
    case "lab_faculty": return <FacultyView isLab />;
    case "student": return <StudentSelfView userId={user.id} />;
    case "parent": {
      const childId = user.childId;
      return childId ? <StudentSelfView userId={childId} viewer="parent" /> : <EmptyState title="No child linked" body="Contact the registrar to link your ward's profile." />;
    }
    default: return <FacultyView isLab={false} />;
  }
}

// ═══ Shared aggregation helpers ═════════════════════════════════════════
function useSectionRows(scope?: { deptIds?: string[]; sectionIds?: string[] }) {
  const sections = useAcademicStore(s => s.sections);
  const programs = useAcademicStore(s => s.programs);
  const users = useUsersStore(s => s.users);
  return useMemo(() => {
    return sections
      .filter(sec => {
        const prog = programs.find(p => p.id === sec.programId);
        if (scope?.deptIds && !scope.deptIds.includes(prog?.departmentId ?? "")) return false;
        if (scope?.sectionIds && !scope.sectionIds.includes(sec.id)) return false;
        return true;
      })
      .map(sec => {
        const stu = users.filter(u => u.role === "student" && u.sectionId === sec.id);
        const avg = stu.length ? Math.round(stu.reduce((a, b) => a + (b.attendancePct ?? 0), 0) / stu.length) : 0;
        const below75 = stu.filter(s => (s.attendancePct ?? 0) < 75).length;
        const below65 = stu.filter(s => (s.attendancePct ?? 0) < 65).length;
        const prog = programs.find(p => p.id === sec.programId);
        return { sec, stu, avg, below75, below65, prog, deptId: prog?.departmentId ?? "" };
      });
  }, [sections, programs, users, scope?.deptIds?.join(","), scope?.sectionIds?.join(",")]);
}

// ═══ Executive view — HOI / Registrar (read-only) ═══════════════════════
function ExecutiveView({ role }: { role: "hoi" | "registrar" }) {
  const rows = useSectionRows();
  const departments = useAcademicStore(s => s.departments);
  const users = useUsersStore(s => s.users);
  const attendance = useAcademicStore(s => s.attendance);
  const submissions = useAttendanceWorkflow(s => s.submissions);
  const addAudit = useAccessStore(s => s.addAudit);
  const { user } = useAccess();
  const [period, setPeriod] = useState<"week"|"month"|"term">("month");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [threshold, setThreshold] = useState<string>("all");
  const [drill, setDrill] = useState<string | null>(null);

  const filteredRows = rows.filter(r => deptFilter === "all" || r.deptId === deptFilter);
  const allStudents = users.filter(u => u.role === "student" && (deptFilter === "all" || u.department === deptFilter));
  const overallAvg = allStudents.length ? Math.round(allStudents.reduce((a, b) => a + (b.attendancePct ?? 0), 0) / allStudents.length) : 0;
  const below75 = allStudents.filter(s => (s.attendancePct ?? 0) < 75).length;
  const below65 = allStudents.filter(s => (s.attendancePct ?? 0) < 65).length;

  const deptStats = departments.map(d => {
    const stu = users.filter(u => u.role === "student" && u.department === d.id);
    const avg = stu.length ? Math.round(stu.reduce((a, b) => a + (b.attendancePct ?? 0), 0) / stu.length) : 0;
    return { ...d, avg, count: stu.length, below75: stu.filter(s => (s.attendancePct ?? 0) < 75).length };
  }).filter(d => d.count > 0).sort((a,b) => b.avg - a.avg);

  const thresholdNum = threshold === "all" ? 100 : parseInt(threshold);
  const risk = allStudents
    .filter(s => (s.attendancePct ?? 0) < thresholdNum)
    .sort((a,b) => (a.attendancePct ?? 0) - (b.attendancePct ?? 0))
    .slice(0, 20);

  const facultyPerf = users.filter(u => u.role === "faculty" || u.role === "lab_faculty").map(f => {
    const subs = attendance.filter(a => a.facultyId === f.id).length;
    const pending = submissions.filter(a => a.facultyId === f.id && a.status === "pending").length;
    return { f, submissions: subs, pending, on_time: Math.min(100, 70 + (subs * 3) % 30) };
  }).slice(0, 10);

  const pendingApprovals = submissions.filter(s => s.status === "pending").length;
  const rejectedToday = submissions.filter(s => s.status === "rejected" && s.decidedAt?.slice(0,10) === new Date().toISOString().slice(0,10)).length;
  const trend = [72, 74, 73, 76, 78, 77, overallAvg];

  const handleExport = () => {
    const rowsCsv = ["Section,Program,Students,Avg %,Below 75%,Critical <65%"];
    filteredRows.forEach(r => rowsCsv.push(`${r.sec.name},${r.prog?.name ?? ""},${r.stu.length},${r.avg},${r.below75},${r.below65}`));
    const blob = new Blob([rowsCsv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `attendance-institution-${period}.csv`; a.click();
    URL.revokeObjectURL(url);
    addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hoi", module: "Attendance", action: `Exported institution attendance (${period})` });
    toast.success("Institution attendance report exported");
  };

  const detail = drill ? rows.find(r => r.sec.id === drill) : null;

  return (
    <div>
      <PageHeader
        title={role === "hoi" ? "Institution Attendance" : "Attendance Oversight"}
        subtitle={role === "hoi" ? "Executive dashboard — trends, risks and departmental comparison" : "Read-only oversight, corrections and audit trail"}
        action={
          <div className="flex gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="term">This Term</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Export</Button>
          </div>
        }
        filters={
          <div className="flex gap-2 flex-wrap">
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-56"><SelectValue placeholder="All departments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={threshold} onValueChange={setThreshold}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Attendance %" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All students</SelectItem>
                <SelectItem value="90">Below 90%</SelectItem>
                <SelectItem value="85">Below 85%</SelectItem>
                <SelectItem value="80">Below 80%</SelectItem>
                <SelectItem value="75">Below 75%</SelectItem>
                <SelectItem value="70">Below 70%</SelectItem>
                <SelectItem value="65">Below 65%</SelectItem>
                <SelectItem value="50">Below 50%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Institution Avg" value={`${overallAvg}%`} icon={TrendingUp} tone={overallAvg >= 75 ? "green" : "amber"} />
        <KpiCard label="Sections" value={filteredRows.length} icon={ClipboardCheck} />
        <KpiCard label="Below 75%" value={below75} icon={AlertTriangle} tone="amber" />
        <KpiCard label="Awaiting HOD Approval" value={pendingApprovals} icon={Clock} tone={pendingApprovals > 0 ? "amber" : undefined} />
      </div>

      <Tabs defaultValue="departments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="departments">Department Comparison</TabsTrigger>
          <TabsTrigger value="trends">Trends & Heatmap</TabsTrigger>
          <TabsTrigger value="risk">Risk Students</TabsTrigger>
          <TabsTrigger value="faculty">Faculty Compliance</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Department attendance ranking</h3>
              <Badge variant="secondary">{deptStats.length} departments</Badge>
            </div>
            <div className="space-y-3">
              {deptStats.map(d => (
                <div key={d.id} className="flex items-center gap-3">
                  <div className="w-52 text-sm font-medium truncate">{d.name}</div>
                  <div className="flex-1 h-6 rounded-md bg-muted overflow-hidden">
                    <div className={cn("h-full flex items-center justify-end px-2 text-xs font-semibold text-white",
                      d.avg >= 80 ? "bg-lnx-green-500" : d.avg >= 75 ? "bg-lnx-teal-500" : d.avg >= 65 ? "bg-lnx-amber-500" : "bg-lnx-red-500")}
                      style={{ width: `${d.avg}%` }}>
                      {d.avg}%
                    </div>
                  </div>
                  <div className="w-24 text-xs text-muted-foreground text-right">{d.count} students</div>
                  <div className="w-24 text-right">
                    {d.below75 > 0 ? <Badge variant="secondary" className="bg-lnx-amber-500/10 text-lnx-amber-500">{d.below75} at risk</Badge> : <Badge variant="secondary" className="bg-lnx-green-500/10 text-lnx-green-500">Healthy</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-3">Weekly attendance trend</h3>
              <div className="flex items-end gap-2 h-40">
                {trend.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full rounded-t-md bg-lnx-teal-500/70" style={{ height: `${v}%` }} />
                    <span className="text-[10px] text-muted-foreground">W{i+1}</span>
                    <span className="text-xs font-semibold">{v}%</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-3">Weekly heatmap (Mon–Fri)</h3>
              <div className="space-y-2">
                {["Mon","Tue","Wed","Thu","Fri"].map((d, di) => (
                  <div key={d} className="flex items-center gap-2">
                    <div className="w-10 text-xs text-muted-foreground">{d}</div>
                    {Array.from({ length: 6 }).map((_, si) => {
                      const v = 60 + ((di * 7 + si * 11) % 40);
                      return <div key={si} className={cn("flex-1 h-8 rounded-sm flex items-center justify-center text-[10px] font-semibold text-white",
                        v >= 85 ? "bg-lnx-green-500" : v >= 75 ? "bg-lnx-teal-500" : v >= 65 ? "bg-lnx-amber-500" : "bg-lnx-red-500")}>{v}%</div>;
                    })}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">Slot 1 → Slot 6 across weekdays. Post-lunch dip is normal.</p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk">
          <Card className="p-0">
            {risk.length === 0 ? <div className="p-8"><EmptyState title="No students below threshold" body="No students match the selected filter." /></div> : (
              <Table>
                <TableHeader><TableRow><TableHead>Roll</TableHead><TableHead>Student</TableHead><TableHead>Department</TableHead><TableHead>Section</TableHead><TableHead>Attendance</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {risk.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.rollNo}</TableCell>
                      <TableCell><Link to="/people/students/$id" params={{ id: s.id }} className="hover:underline font-medium">{s.firstName} {s.lastName}</Link></TableCell>
                      <TableCell>{s.department}</TableCell>
                      <TableCell>{s.sectionId}</TableCell>
                      <TableCell><Badge variant="secondary" className={attendanceBadge(s.attendancePct ?? 0)}>{s.attendancePct}%</Badge></TableCell>
                      <TableCell><Button asChild size="sm" variant="ghost"><Link to="/people/students/$id" params={{ id: s.id }}>Profile</Link></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="faculty">
          <Card className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Faculty</TableHead><TableHead>Department</TableHead><TableHead>Submissions (30d)</TableHead><TableHead>Pending</TableHead><TableHead>On-time %</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {facultyPerf.map(({ f, submissions: subs, pending, on_time }) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.firstName} {f.lastName}</TableCell>
                    <TableCell>{f.department ?? "—"}</TableCell>
                    <TableCell>{subs}</TableCell>
                    <TableCell>{pending > 0 ? <Badge variant="secondary" className="bg-lnx-amber-500/10 text-lnx-amber-500">{pending}</Badge> : "—"}</TableCell>
                    <TableCell><Badge variant="secondary" className={attendanceBadge(on_time)}>{on_time}%</Badge></TableCell>
                    <TableCell>{on_time >= 85 ? <Badge variant="secondary" className="bg-lnx-green-500/10 text-lnx-green-500">Excellent</Badge> : on_time >= 75 ? <Badge variant="secondary">On track</Badge> : <Badge variant="destructive">Attention</Badge>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          {rejectedToday > 0 && <p className="text-xs text-muted-foreground mt-2">{rejectedToday} rejected today across the institution.</p>}
        </TabsContent>

        <TabsContent value="sections">
          <SectionsTable rows={filteredRows} onOpen={setDrill} />
        </TabsContent>
      </Tabs>

      <SectionDrillDialog open={!!drill} onClose={() => setDrill(null)} detail={detail} />
    </div>
  );
}

// ═══ HOD view — department scope + approval queue ═══════════════════════
function HodView() {
  const { user } = useAccess();
  const deptIds = user?.scope?.ids ?? [];
  const rows = useSectionRows({ deptIds });
  const users = useUsersStore(s => s.users);
  const subjects = useAcademicStore(s => s.subjects);
  const addAudit = useAccessStore(s => s.addAudit);
  const submissions = useAttendanceWorkflow(s => s.submissions);
  const corrections = useAttendanceWorkflow(s => s.corrections);
  const updateSubmission = useAttendanceWorkflow(s => s.updateSubmission);
  const updateCorrection = useAttendanceWorkflow(s => s.updateCorrection);
  const [drill, setDrill] = useState<string | null>(null);
  const [reviewSub, setReviewSub] = useState<AttendanceSubmission | null>(null);
  const [decisionCtx, setDecisionCtx] = useState<{ id: string; kind: "reject"|"return"; type: "submission"|"correction" } | null>(null);
  const [decisionNote, setDecisionNote] = useState("");

  // Department-scoped submissions & corrections
  const deptSectionIds = rows.map(r => r.sec.id);
  const scopedSubs = submissions.filter(s => deptSectionIds.includes(s.sectionId));
  const pendingSubs = scopedSubs.filter(s => s.status === "pending");
  const scopedCorrections = corrections.filter(c => deptSectionIds.includes(c.sectionId) && c.status !== "approved" && c.status !== "rejected");

  const deptStu = users.filter(u => u.role === "student" && deptIds.includes(u.department ?? ""));
  const avg = deptStu.length ? Math.round(deptStu.reduce((a,b) => a + (b.attendancePct ?? 0), 0) / deptStu.length) : 0;
  const below75 = deptStu.filter(s => (s.attendancePct ?? 0) < 75).length;
  const below65 = deptStu.filter(s => (s.attendancePct ?? 0) < 65).length;
  const detail = drill ? rows.find(r => r.sec.id === drill) : null;

  const approve = (sub: AttendanceSubmission) => {
    // Publish downstream via existing cascade — this updates student pct + parents.
    saveAttendanceCascade({
      id: sub.id, sectionId: sub.sectionId, subjectId: sub.subjectId,
      facultyId: sub.facultyId, date: sub.date, slot: sub.slot,
      marks: sub.marks, submittedAt: sub.submittedAt,
    }, user?.id ?? "u_hod");
    updateSubmission(sub.id, { status: "approved", decidedBy: user?.id, decidedAt: new Date().toISOString() });
    addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hod", module: "Attendance", action: `Approved attendance · ${sub.sectionId} · ${sub.date}`, targetId: sub.id });
    toast.success("Attendance approved and published");
    setReviewSub(null);
  };

  const submitDecision = () => {
    if (!decisionCtx || !decisionNote.trim()) return;
    if (decisionCtx.type === "submission") {
      const status: SubmissionStatus = decisionCtx.kind === "reject" ? "rejected" : "returned";
      updateSubmission(decisionCtx.id, { status, decidedBy: user?.id, decidedAt: new Date().toISOString(), decisionNote });
      addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hod", module: "Attendance", action: `${decisionCtx.kind === "reject" ? "Rejected" : "Returned"} attendance submission`, targetId: decisionCtx.id, reason: decisionNote });
      toast.success(decisionCtx.kind === "reject" ? "Submission rejected" : "Returned to faculty for revision");
    } else {
      updateCorrection(decisionCtx.id, {
        status: decisionCtx.kind === "reject" ? "rejected" : "pending_faculty",
        hodDecision: { by: user?.id ?? "", at: new Date().toISOString(), note: decisionNote, approved: false },
      });
      toast.success("Correction routed");
    }
    setDecisionCtx(null); setDecisionNote(""); setReviewSub(null);
  };

  return (
    <div>
      <PageHeader
        title="Department Attendance"
        subtitle={`Scope: ${deptIds.join(", ") || "your department"} — approvals, monitoring and analytics`}
        action={<Button variant="outline" onClick={() => toast.success("Department report exported")}><Download className="h-4 w-4 mr-2" />Export</Button>}
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Dept Avg" value={`${avg}%`} icon={TrendingUp} tone={avg >= 75 ? "green" : "amber"} />
        <KpiCard label="Pending Approvals" value={pendingSubs.length} icon={ClipboardCheck} tone={pendingSubs.length > 0 ? "amber" : undefined} />
        <KpiCard label="Below 75%" value={below75} icon={AlertTriangle} tone="amber" />
        <KpiCard label="Correction Requests" value={scopedCorrections.length} icon={MessageSquare} tone={scopedCorrections.length > 0 ? "amber" : undefined} />
      </div>

      <Tabs defaultValue="approvals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="approvals">Attendance Approvals {pendingSubs.length > 0 && <Badge variant="destructive" className="ml-2 h-4 px-1.5">{pendingSubs.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="corrections">Corrections {scopedCorrections.length > 0 && <Badge variant="secondary" className="ml-2 h-4 px-1.5">{scopedCorrections.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="risk">At-Risk ({below65})</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals">
          <Card className="p-0">
            {pendingSubs.length === 0 ? <div className="p-8"><EmptyState title="Nothing awaiting approval" body="Faculty submissions will queue here for your review." /></div> : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Faculty</TableHead><TableHead>Section</TableHead><TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead>Room</TableHead>
                  <TableHead>Marked</TableHead><TableHead>Submitted</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {pendingSubs.map(s => {
                    const sub = subjects.find(x => x.id === s.subjectId);
                    const p = Object.values(s.marks).filter(v => v === "P").length;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.facultyName}</TableCell>
                        <TableCell>{s.sectionId}</TableCell>
                        <TableCell>{sub?.code} · <span className="text-muted-foreground text-xs">{sub?.name}</span></TableCell>
                        <TableCell className="text-xs">{s.date}</TableCell>
                        <TableCell className="text-xs">{s.startTime}–{s.endTime}</TableCell>
                        <TableCell className="text-xs">{s.roomId ?? "—"}</TableCell>
                        <TableCell><Badge variant="secondary">{p}/{s.totalStudents}</Badge></TableCell>
                        <TableCell className="text-xs">{new Date(s.submittedAt).toLocaleString("en-IN")}</TableCell>
                        <TableCell><Button size="sm" onClick={() => setReviewSub(s)}><Eye className="h-3 w-3 mr-1" />Review</Button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="corrections">
          <Card className="p-0">
            {scopedCorrections.length === 0 ? <div className="p-8"><EmptyState title="No correction requests" body="Student and faculty correction requests will appear here." /></div> : (
              <div className="divide-y">
                {scopedCorrections.map(c => {
                  const sub = subjects.find(x => x.id === c.subjectId);
                  return (
                    <div key={c.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">{c.studentName}</p>
                            <span className="text-xs text-muted-foreground">{c.rollNo}</span>
                            <Badge variant="secondary">{c.correctionType.replace("_"," ")}</Badge>
                            <Badge variant="secondary" className={c.status === "pending_faculty" ? "bg-lnx-amber-500/10 text-lnx-amber-500" : "bg-lnx-teal-500/10 text-lnx-teal-600"}>{c.status.replace("_"," ")}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Concern by <b>{c.facultyName}</b> · {sub?.code} {sub?.name} · {c.date} · {c.startTime}–{c.endTime} · Current: <b>{markLabel[c.currentMark]}</b>
                          </p>
                          <p className="text-sm mt-2">{c.reason}</p>
                        </div>
                        {c.status === "pending_hod" ? (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setDecisionCtx({ id: c.id, kind: "reject", type: "correction" }); setDecisionNote(""); }}><ThumbsDown className="h-3 w-3 mr-1" />Reject</Button>
                            <Button size="sm" onClick={() => {
                              updateCorrection(c.id, { status: "approved", hodDecision: { by: user?.id ?? "", at: new Date().toISOString(), note: "Approved", approved: true } });
                              addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hod", module: "Attendance", action: "Approved correction", targetId: c.id });
                              toast.success("Correction approved");
                            }}><ThumbsUp className="h-3 w-3 mr-1" />Approve</Button>
                          </div>
                        ) : <Badge variant="secondary">Awaiting faculty</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="sections">
          <SectionsTable rows={rows} onOpen={setDrill} />
        </TabsContent>

        <TabsContent value="risk">
          <Card className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Roll</TableHead><TableHead>Student</TableHead><TableHead>Section</TableHead><TableHead>Attendance</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {deptStu.filter(s => (s.attendancePct ?? 0) < 65).map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.rollNo}</TableCell>
                    <TableCell><Link to="/people/students/$id" params={{ id: s.id }} className="hover:underline">{s.firstName} {s.lastName}</Link></TableCell>
                    <TableCell>{s.sectionId}</TableCell>
                    <TableCell><Badge variant="secondary" className={attendanceBadge(s.attendancePct ?? 0)}>{s.attendancePct}%</Badge></TableCell>
                    <TableCell><Button asChild size="sm" variant="ghost"><Link to="/people/students/$id" params={{ id: s.id }}>Profile</Link></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <SectionDrillDialog open={!!drill} onClose={() => setDrill(null)} detail={detail} />

      {/* Full attendance sheet review */}
      <Sheet open={!!reviewSub} onOpenChange={(v) => !v && setReviewSub(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {reviewSub && <ReviewSheet sub={reviewSub}
            onApprove={() => approve(reviewSub)}
            onReject={() => { setDecisionCtx({ id: reviewSub.id, kind: "reject", type: "submission" }); setDecisionNote(""); }}
            onReturn={() => { setDecisionCtx({ id: reviewSub.id, kind: "return", type: "submission" }); setDecisionNote(""); }} />}
        </SheetContent>
      </Sheet>

      {/* Reject / Return dialog with mandatory remarks */}
      <Dialog open={!!decisionCtx} onOpenChange={(v) => !v && setDecisionCtx(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decisionCtx?.kind === "reject" ? "Reject with remarks" : "Return to faculty"}</DialogTitle>
            <DialogDescription>{decisionCtx?.kind === "reject" ? "This submission will be marked rejected and audit-logged. Faculty must re-submit." : "Faculty will be able to edit and re-submit."} Remarks are mandatory.</DialogDescription>
          </DialogHeader>
          <Textarea value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} placeholder="Explain the reason…" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionCtx(null)}>Cancel</Button>
            <Button disabled={!decisionNote.trim()} onClick={submitDecision}>{decisionCtx?.kind === "reject" ? "Reject" : "Return"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReviewSheet({ sub, onApprove, onReject, onReturn }: { sub: AttendanceSubmission; onApprove: () => void; onReject: () => void; onReturn: () => void }) {
  const subjects = useAcademicStore(s => s.subjects);
  const users = useUsersStore(s => s.users);
  const subject = subjects.find(s => s.id === sub.subjectId);
  const roster = users.filter(u => u.role === "student" && u.sectionId === sub.sectionId);
  const counts = MARKS.reduce((acc, m) => ({ ...acc, [m]: Object.values(sub.marks).filter(v => v === m).length }), {} as Record<Mark, number>);

  return (
    <>
      <SheetHeader>
        <SheetTitle>{subject?.code} · {subject?.name}</SheetTitle>
        <SheetDescription>
          {sub.facultyName} · {sub.sectionId} · {sub.date} · {sub.startTime}–{sub.endTime} · Room {sub.roomId ?? "—"}
        </SheetDescription>
      </SheetHeader>
      <div className="grid grid-cols-4 gap-2 text-xs my-4">
        <div className="rounded-md bg-lnx-green-500/10 text-lnx-green-500 py-1 text-center font-semibold">Present {counts.P}</div>
        <div className="rounded-md bg-lnx-red-500/10 text-lnx-red-500 py-1 text-center font-semibold">Absent {counts.A}</div>
        <div className="rounded-md bg-lnx-amber-500/10 text-lnx-amber-500 py-1 text-center font-semibold">Leave {counts.L}</div>
        <div className="rounded-md bg-muted py-1 text-center font-semibold">Medical {counts.ML}</div>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Roll</TableHead><TableHead>Student</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>
          {roster.map(s => {
            const m = sub.marks[s.id];
            return (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs">{s.rollNo}</TableCell>
                <TableCell>{s.firstName} {s.lastName}</TableCell>
                <TableCell>{m ? <Badge variant="secondary" className={cn(markStyle[m], "border-0")}>{markLabel[m]}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="flex flex-wrap gap-2 justify-end mt-4 sticky bottom-0 bg-background py-3 border-t">
        <Button variant="outline" onClick={onReturn}><Undo2 className="h-3 w-3 mr-1" />Return to Faculty</Button>
        <Button variant="outline" onClick={onReject}><ThumbsDown className="h-3 w-3 mr-1" />Reject</Button>
        <Button onClick={onApprove}><ThumbsUp className="h-3 w-3 mr-1" />Approve & Publish</Button>
      </div>
    </>
  );
}

// ═══ Sections table (shared) ════════════════════════════════════════════
function SectionsTable({ rows, onOpen }: { rows: ReturnType<typeof useSectionRows>; onOpen: (id: string) => void }) {
  return (
    <Card className="p-0">
      <Table>
        <TableHeader><TableRow><TableHead>Section</TableHead><TableHead>Program</TableHead><TableHead>Students</TableHead><TableHead>Avg</TableHead><TableHead>Below 75%</TableHead><TableHead>Critical</TableHead><TableHead></TableHead></TableRow></TableHeader>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.sec.id} className="cursor-pointer" onClick={() => onOpen(r.sec.id)}>
              <TableCell className="font-medium">{r.sec.name}</TableCell>
              <TableCell className="text-xs">{r.prog?.name ?? "—"}</TableCell>
              <TableCell>{r.stu.length}</TableCell>
              <TableCell><Badge variant="secondary" className={attendanceBadge(r.avg)}>{r.avg}%</Badge></TableCell>
              <TableCell>{r.below75}</TableCell>
              <TableCell>{r.below65 > 0 ? <Badge variant="destructive">{r.below65}</Badge> : <span className="text-xs text-muted-foreground">0</span>}</TableCell>
              <TableCell><Button size="sm" variant="ghost"><Eye className="h-3 w-3 mr-1" />View</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function SectionDrillDialog({ open, onClose, detail }: { open: boolean; onClose: () => void; detail: ReturnType<typeof useSectionRows>[number] | null | undefined }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{detail?.sec.name} · {detail?.prog?.name}</DialogTitle></DialogHeader>
        {detail && (
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Roll</TableHead><TableHead>Student</TableHead><TableHead>Attendance</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {detail.stu.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.rollNo}</TableCell>
                    <TableCell><Link to="/people/students/$id" params={{ id: s.id }} className="hover:underline">{s.firstName} {s.lastName}</Link></TableCell>
                    <TableCell><Badge variant="secondary" className={attendanceBadge(s.attendancePct ?? 0)}>{s.attendancePct ?? 0}%</Badge></TableCell>
                    <TableCell><Button asChild size="sm" variant="ghost"><Link to="/people/students/$id" params={{ id: s.id }}>Profile</Link></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ═══ Faculty / Lab Faculty view ════════════════════════════════════════
function FacultyView({ isLab }: { isLab: boolean }) {
  const sections = useAcademicStore(s => s.sections);
  const subjects = useAcademicStore(s => s.subjects);
  const timetable = useAcademicStore(s => s.timetable);
  const rooms = useAcademicStore(s => s.rooms);
  const users = useUsersStore(s => s.users);
  const { user } = useAccess();
  const addAudit = useAccessStore(s => s.addAudit);
  const submissions = useAttendanceWorkflow(s => s.submissions);
  const corrections = useAttendanceWorkflow(s => s.corrections);
  const updateSubmission = useAttendanceWorkflow(s => s.updateSubmission);
  const updateCorrection = useAttendanceWorkflow(s => s.updateCorrection);
  const addLeave = useAttendanceWorkflow(s => s.addLeave);

  const scopedSections = user?.scope?.ids?.length ? sections.filter(s => user!.scope.ids.includes(s.id)) : sections;

  const today = new Date();
  const dayIdx = today.getDay() === 0 ? 1 : today.getDay();
  const todayISO = today.toISOString().slice(0, 10);

  const todaysClasses = useMemo(() => {
    const mine = timetable.filter(t => (t.facultyId === user?.id) && t.day === (dayIdx - 1));
    if (mine.length) return mine;
    return timetable.filter(t => scopedSections.some(s => s.id === t.sectionId) && t.day === (dayIdx - 1));
  }, [timetable, user?.id, dayIdx, scopedSections]);

  const subStatus = (sectionId: string, subjectId: string, slot: number, date = todayISO) =>
    submissions.find(s => s.sectionId === sectionId && s.subjectId === subjectId && s.date === date && s.slot === slot);

  const [markCtx, setMarkCtx] = useState<{ secId: string; subId: string; slot: number; batch?: string; roomId?: string; date?: string } | null>(null);
  const [correctionCtx, setCorrectionCtx] = useState<AttendanceSubmission | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [unsubmitId, setUnsubmitId] = useState<string | null>(null);
  const [correctionDecide, setCorrectionDecide] = useState<{ id: string; kind: "approve" | "reject" } | null>(null);
  const [correctionNote, setCorrectionNote] = useState("");

  const mySubs = submissions.filter(s => s.facultyId === user?.id || scopedSections.some(x => x.id === s.sectionId));
  const pending = todaysClasses.filter(t => t.subjectId && !subStatus(t.sectionId, t.subjectId!, t.slot)).length;
  const awaitingHod = mySubs.filter(s => s.status === "pending").length;
  const returned = mySubs.filter(s => s.status === "returned").length;

  // Corrections routed to this faculty (own subjects) that need faculty review
  const myCorrections = corrections.filter(c =>
    (c.facultyId === user?.id || scopedSections.some(x => x.id === c.sectionId)) &&
    c.status === "pending_faculty"
  );

  const unsubmit = (id: string) => {
    updateSubmission(id, { status: "draft", decisionNote: "Withdrawn by faculty", decidedAt: new Date().toISOString() });
    addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? "", module: "Attendance", action: "Unsubmitted attendance", targetId: id, reason: "Withdrawn before HOD decision" });
    toast.success("Submission withdrawn", { description: "You can now edit and resubmit." });
    setUnsubmitId(null);
  };

  const decideCorrection = () => {
    if (!correctionDecide) return;
    if (correctionDecide.kind === "approve") {
      updateCorrection(correctionDecide.id, {
        status: "pending_hod",
        facultyDecision: { by: user?.id ?? "", at: new Date().toISOString(), note: correctionNote || "Approved by faculty", approved: true },
      });
      toast.success("Correction endorsed — routed to HOD");
    } else {
      updateCorrection(correctionDecide.id, {
        status: "rejected",
        facultyDecision: { by: user?.id ?? "", at: new Date().toISOString(), note: correctionNote || "Rejected by faculty", approved: false },
      });
      toast.success("Correction rejected");
    }
    addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? "", module: "Attendance", action: `${correctionDecide.kind === "approve" ? "Endorsed" : "Rejected"} correction`, targetId: correctionDecide.id, reason: correctionNote });
    setCorrectionDecide(null); setCorrectionNote("");
  };

  return (
    <div>
      <PageHeader
        title={isLab ? "Lab Attendance" : "Attendance"}
        subtitle={`${today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} — ${todaysClasses.length} classes scheduled`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLeaveOpen(true)}><CalendarDays className="h-4 w-4 mr-2" />Apply Leave</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Today's Classes" value={todaysClasses.length} icon={ClipboardCheck} />
        <KpiCard label="Pending Submit" value={pending} icon={Clock} tone={pending > 0 ? "amber" : "green"} />
        <KpiCard label="Awaiting HOD" value={awaitingHod} icon={Clock} tone={awaitingHod > 0 ? "amber" : undefined} />
        <KpiCard label="Correction Requests" value={myCorrections.length} icon={MessageSquare} tone={myCorrections.length > 0 ? "amber" : undefined} />
      </div>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="quick">Quick Mark {pending > 0 && <Badge variant="secondary" className="ml-2 h-4 px-1.5">{pending}</Badge>}</TabsTrigger>
          <TabsTrigger value="corrections">
            Corrections {myCorrections.length > 0 && <Badge variant="destructive" className="ml-2 h-4 px-1.5">{myCorrections.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="history">History {returned > 0 && <Badge variant="secondary" className="ml-2 h-4 px-1.5 bg-lnx-red-500/10 text-lnx-red-500">{returned}</Badge>}</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          {todaysClasses.length === 0 ? (
            <Card className="p-8"><EmptyState title="No classes today" body="Enjoy the day — or apply a leave in advance from the button above." /></Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {todaysClasses.map(t => {
                const sub = subjects.find(s => s.id === t.subjectId);
                const record = t.subjectId ? subStatus(t.sectionId, t.subjectId, t.slot) : undefined;
                const status = record?.status;
                const locked = status === "pending" || status === "approved" || status === "locked";
                const { start, end } = slotTime(t.slot);
                return (
                  <Card key={t.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{sub?.code} · {sub?.name}</p>
                          {status ? <Badge variant="secondary" className={statusStyle[status]}>{statusLabel[status]}</Badge>
                                  : <Badge variant="secondary" className="bg-lnx-amber-500/10 text-lnx-amber-500">Not submitted</Badge>}
                          {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{t.sectionId} · {start}–{end} · Room {t.roomId}</p>
                        {status === "returned" && record?.decisionNote && <p className="text-xs text-lnx-red-500 mt-1">HOD note: {record.decisionNote}</p>}
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <Button size="sm" variant={locked ? "outline" : "default"}
                          onClick={() => setMarkCtx({ secId: t.sectionId, subId: t.subjectId!, slot: t.slot, roomId: t.roomId, date: todayISO })}>
                          {locked ? <><Eye className="h-3 w-3 mr-1" />View</> : status === "returned" ? <><Save className="h-3 w-3 mr-1" />Revise</> : <><ClipboardCheck className="h-3 w-3 mr-1" />Mark</>}
                        </Button>
                        {status === "pending" && record && (
                          <Button size="sm" variant="ghost" className="text-lnx-red-500 h-7" onClick={() => setUnsubmitId(record.id)}>
                            <Undo2 className="h-3 w-3 mr-1" />Unsubmit
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="quick">
          <QuickMarkPicker
            timetable={timetable}
            scopedSections={scopedSections}
            subjects={subjects}
            rooms={rooms}
            facultyId={user?.id ?? ""}
            subStatus={subStatus}
            onOpen={setMarkCtx}
            isLab={isLab}
          />
        </TabsContent>

        <TabsContent value="corrections">
          <Card className="p-0">
            {myCorrections.length === 0 ? <div className="p-8"><EmptyState title="No correction requests" body="Corrections raised by students or parents on your classes will appear here for endorsement." /></div> : (
              <div className="divide-y">
                {myCorrections.map(c => {
                  const sub = subjects.find(x => x.id === c.subjectId);
                  return (
                    <div key={c.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">{c.studentName}</p>
                            <span className="text-xs text-muted-foreground">{c.rollNo}</span>
                            <Badge variant="secondary">{c.correctionType.replace("_", " ")}</Badge>
                            <Badge variant="secondary" className="bg-lnx-amber-500/10 text-lnx-amber-500">Awaiting your review</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {sub?.code} {sub?.name} · {c.date} · {c.startTime}–{c.endTime} · Current: <b>{markLabel[c.currentMark]}</b> · Raised by {c.raisedByRole}
                          </p>
                          <p className="text-sm mt-2">{c.reason}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setCorrectionDecide({ id: c.id, kind: "reject" }); setCorrectionNote(""); }}>
                            <ThumbsDown className="h-3 w-3 mr-1" />Reject
                          </Button>
                          <Button size="sm" onClick={() => { setCorrectionDecide({ id: c.id, kind: "approve" }); setCorrectionNote(""); }}>
                            <ThumbsUp className="h-3 w-3 mr-1" />Endorse → HOD
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-0">
            {mySubs.length === 0 ? <div className="p-8"><EmptyState title="No submissions yet" body="Once you submit attendance it will appear here with approval status." /></div> : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead><TableHead>Section</TableHead><TableHead>Subject</TableHead>
                  <TableHead>Time</TableHead><TableHead>Summary</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {mySubs.slice(0, 40).map(a => {
                    const subj = subjects.find(s => s.id === a.subjectId);
                    const p = Object.values(a.marks).filter(v => v === "P").length;
                    const total = Object.keys(a.marks).length;
                    const canUnsubmit = a.status === "pending" || a.status === "returned";
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs">{a.date}</TableCell>
                        <TableCell>{a.sectionId}</TableCell>
                        <TableCell>{subj?.code}</TableCell>
                        <TableCell className="text-xs">{a.startTime}–{a.endTime}</TableCell>
                        <TableCell><Badge variant="secondary" className={attendanceBadge(Math.round(p / total * 100))}>{p}/{total} ({Math.round(p / total * 100)}%)</Badge></TableCell>
                        <TableCell><Badge variant="secondary" className={statusStyle[a.status]}>{statusLabel[a.status]}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" title="View" onClick={() => setMarkCtx({ secId: a.sectionId, subId: a.subjectId, slot: a.slot, roomId: a.roomId, date: a.date })}><Eye className="h-3 w-3" /></Button>
                            <Button size="sm" variant="ghost" title="Raise correction" onClick={() => setCorrectionCtx(a)}><MessageSquare className="h-3 w-3" /></Button>
                            {canUnsubmit && <Button size="sm" variant="ghost" title="Unsubmit" className="text-lnx-red-500" onClick={() => setUnsubmitId(a.id)}><Undo2 className="h-3 w-3" /></Button>}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {markCtx && <MarkingDialog ctx={markCtx} onClose={() => setMarkCtx(null)} isLab={isLab} />}
      {correctionCtx && <CorrectionDialog
        onClose={() => setCorrectionCtx(null)}
        prefill={{
          sectionId: correctionCtx.sectionId,
          subjectId: correctionCtx.subjectId,
          date: correctionCtx.date,
          slot: correctionCtx.slot,
          facultyId: correctionCtx.facultyId,
          facultyName: correctionCtx.facultyName ?? "",
        }}
        raisedBy={user?.id ?? ""}
        raisedByRole={isLab ? "lab_faculty" : "faculty"}
      />}
      <LeaveDialog open={leaveOpen} onClose={() => setLeaveOpen(false)} onSubmit={(payload) => {
        addLeave({
          id: `lv_${Date.now().toString(36)}`,
          facultyId: user?.id ?? "",
          facultyName: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
          department: user?.department,
          from: payload.from, to: payload.to, reason: payload.reason,
          raisedAt: new Date().toISOString(), status: "pending",
        });
        addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? "", module: "Attendance", action: "Submitted leave application", reason: payload.reason });
        toast.success("Leave request sent to HOD for approval");
      }} />

      {/* Unsubmit confirmation */}
      <Dialog open={!!unsubmitId} onOpenChange={(v) => !v && setUnsubmitId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsubmit this attendance?</DialogTitle>
            <DialogDescription>
              This will withdraw the submission from HOD's approval queue. The record will move back to draft
              and you can edit it before resubmitting. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnsubmitId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => unsubmitId && unsubmit(unsubmitId)}>
              <Undo2 className="h-3 w-3 mr-1" />Yes, unsubmit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Correction endorse / reject */}
      <Dialog open={!!correctionDecide} onOpenChange={(v) => !v && setCorrectionDecide(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{correctionDecide?.kind === "approve" ? "Endorse correction and route to HOD" : "Reject correction request"}</DialogTitle>
            <DialogDescription>
              {correctionDecide?.kind === "approve"
                ? "Your endorsement routes this to the HOD for final approval. Add an optional note."
                : "The student will be notified. Please add a brief reason."}
            </DialogDescription>
          </DialogHeader>
          <Textarea value={correctionNote} onChange={(e) => setCorrectionNote(e.target.value)} placeholder={correctionDecide?.kind === "approve" ? "Optional note…" : "Reason for rejection…"} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectionDecide(null)}>Cancel</Button>
            <Button disabled={correctionDecide?.kind === "reject" && !correctionNote.trim()} onClick={decideCorrection}>
              {correctionDecide?.kind === "approve" ? "Endorse & Route" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuickMarkPicker({ timetable, scopedSections, subjects, rooms, facultyId, subStatus, onOpen, isLab }: {
  timetable: ReturnType<typeof useAcademicStore.getState>["timetable"];
  scopedSections: ReturnType<typeof useAcademicStore.getState>["sections"];
  subjects: ReturnType<typeof useAcademicStore.getState>["subjects"];
  rooms: ReturnType<typeof useAcademicStore.getState>["rooms"];
  facultyId: string;
  subStatus: (secId: string, subId: string, slot: number, date?: string) => AttendanceSubmission | undefined;
  onOpen: (ctx: { secId: string; subId: string; slot: number; batch?: string; roomId?: string; date?: string }) => void;
  isLab: boolean;
}) {
  // Enumerate pending items: last 7 days of scheduled classes without a submission.
  const items = useMemo(() => {
    const out: { date: string; day: number; slot: number; secId: string; subId: string; roomId?: string; kind: "today"|"missed"|"draft"|"returned" }[] = [];
    const today = new Date();
    const todayISO = today.toISOString().slice(0,10);
    for (let d = 6; d >= 0; d--) {
      const dt = new Date(); dt.setDate(dt.getDate() - d);
      const iso = dt.toISOString().slice(0,10);
      const dayOfWeek = dt.getDay(); if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      const dayIdx = dayOfWeek - 1;
      const slots = timetable.filter(t => t.day === dayIdx && (t.facultyId === facultyId || scopedSections.some(s => s.id === t.sectionId)));
      slots.forEach(t => {
        if (!t.subjectId) return;
        const rec = subStatus(t.sectionId, t.subjectId, t.slot, iso);
        if (!rec) out.push({ date: iso, day: dayIdx, slot: t.slot, secId: t.sectionId, subId: t.subjectId, roomId: t.roomId, kind: iso === todayISO ? "today" : "missed" });
        else if (rec.status === "draft") out.push({ date: iso, day: dayIdx, slot: t.slot, secId: t.sectionId, subId: t.subjectId, roomId: t.roomId, kind: "draft" });
        else if (rec.status === "returned") out.push({ date: iso, day: dayIdx, slot: t.slot, secId: t.sectionId, subId: t.subjectId, roomId: t.roomId, kind: "returned" });
      });
    }
    return out;
  }, [timetable, scopedSections, facultyId, subStatus]);

  const groups = { returned: items.filter(i => i.kind === "returned"), draft: items.filter(i => i.kind === "draft"), today: items.filter(i => i.kind === "today"), missed: items.filter(i => i.kind === "missed") };

  const Row = ({ i, kindLabel, tone }: { i: typeof items[number]; kindLabel: string; tone: string }) => {
    const sub = subjects.find(s => s.id === i.subId);
    const { start, end } = slotTime(i.slot);
    return (
      <div className="flex items-center gap-3 p-3 border rounded-lg">
        <Badge variant="secondary" className={tone}>{kindLabel}</Badge>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{sub?.code} · <span className="text-muted-foreground">{sub?.name}</span></p>
          <p className="text-xs text-muted-foreground">{i.date} · {start}–{end} · {i.secId} · Room {i.roomId ?? "—"}</p>
        </div>
        <Button size="sm" onClick={() => onOpen({ secId: i.secId, subId: i.subId, slot: i.slot, roomId: i.roomId, date: i.date, batch: isLab ? "B1" : undefined })}>
          <ClipboardCheck className="h-3 w-3 mr-1" />Mark
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {groups.returned.length > 0 && (
        <Card className="p-4"><h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Returned by HOD</h4>
          <div className="space-y-2">{groups.returned.map(i => <Row key={`${i.date}${i.secId}${i.subId}${i.slot}`} i={i} kindLabel="Returned" tone="bg-lnx-red-500/10 text-lnx-red-500" />)}</div></Card>
      )}
      {groups.today.length > 0 && (
        <Card className="p-4"><h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Today · pending</h4>
          <div className="space-y-2">{groups.today.map(i => <Row key={`${i.date}${i.secId}${i.subId}${i.slot}`} i={i} kindLabel="Today" tone="bg-lnx-amber-500/10 text-lnx-amber-500" />)}</div></Card>
      )}
      {groups.missed.length > 0 && (
        <Card className="p-4"><h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Missed · last 7 days</h4>
          <div className="space-y-2">{groups.missed.slice(0, 12).map(i => <Row key={`${i.date}${i.secId}${i.subId}${i.slot}`} i={i} kindLabel="Missed" tone="bg-muted" />)}</div></Card>
      )}
      {items.length === 0 && <Card className="p-8"><EmptyState title="All caught up" body="No pending attendance in your scope." /></Card>}
    </div>
  );
}

function MarkingDialog({ ctx, onClose, isLab }: { ctx: { secId: string; subId: string; slot: number; batch?: string; roomId?: string; date?: string }; onClose: () => void; isLab: boolean }) {
  const users = useUsersStore(s => s.users);
  const subjects = useAcademicStore(s => s.subjects);
  const { user } = useAccess();
  const submissions = useAttendanceWorkflow(s => s.submissions);
  const addSubmission = useAttendanceWorkflow(s => s.addSubmission);
  const addAudit = useAccessStore(s => s.addAudit);
  const date = ctx.date ?? new Date().toISOString().slice(0, 10);

  const roster = useMemo(() => users.filter(u => u.role === "student" && u.sectionId === ctx.secId), [users, ctx.secId]);
  const existing = submissions.find(a => a.sectionId === ctx.secId && a.subjectId === ctx.subId && a.date === date && a.slot === ctx.slot);
  const locked = existing?.status === "pending" || existing?.status === "approved" || existing?.status === "locked";

  const [marks, setMarks] = useState<Record<string, Mark>>(() => {
    if (existing) return { ...existing.marks } as Record<string, Mark>;
    return Object.fromEntries(roster.map(s => [s.id, "P" as Mark]));
  });
  const [query, setQuery] = useState("");
  const filtered = roster.filter(s => `${s.firstName} ${s.lastName} ${s.rollNo}`.toLowerCase().includes(query.toLowerCase()));
  const counts = MARKS.reduce((acc, m) => ({ ...acc, [m]: Object.values(marks).filter(v => v === m).length }), {} as Record<Mark, number>);
  const sub = subjects.find(s => s.id === ctx.subId);
  const { start, end } = slotTime(ctx.slot);

  const setAll = (m: Mark) => { if (!locked) setMarks(Object.fromEntries(roster.map(s => [s.id, m]))); };

  const submit = () => {
    const record: AttendanceSubmission = {
      id: existing?.id ?? `att_${date}_${ctx.subId}_${ctx.slot}_${Date.now().toString(36)}`,
      sectionId: ctx.secId, subjectId: ctx.subId,
      facultyId: user?.id ?? "u_fac_anjali",
      facultyName: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
      date, slot: ctx.slot, startTime: start, endTime: end,
      roomId: ctx.roomId, isLab, batch: ctx.batch,
      marks, totalStudents: roster.length,
      submittedAt: new Date().toISOString(),
      status: "pending",
    };
    addSubmission(record);
    addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? "", module: "Attendance", action: `Submitted attendance for HOD approval · ${ctx.secId} · ${sub?.code}`, targetId: record.id, reason: `${counts.P}/${roster.length} present` });
    toast.success("Submitted to HOD for approval", { description: `${roster.length} students · ${counts.A} absent · locked until decision` });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{sub?.code} · {sub?.name} {existing && <Badge variant="secondary" className={statusStyle[existing.status]}>{statusLabel[existing.status]}</Badge>}</DialogTitle>
          <DialogDescription>{ctx.secId}{isLab && ctx.batch ? ` · Batch ${ctx.batch}` : ""} · {date} · {start}–{end} · Room {ctx.roomId ?? "—"}</DialogDescription>
        </DialogHeader>
        {existing?.status === "returned" && existing.decisionNote && (
          <div className="rounded-md bg-lnx-red-500/5 border border-lnx-red-500/30 p-3 text-xs">
            <b className="text-lnx-red-500">Returned by HOD:</b> {existing.decisionNote}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 pb-2">
          <Input placeholder="Search roll or name…" className="w-64" value={query} onChange={(e) => setQuery(e.target.value)} />
          {!locked && (
            <div className="ml-auto flex gap-1">
              <Button size="sm" variant="outline" onClick={() => setAll("P")}>All Present</Button>
              <Button size="sm" variant="outline" onClick={() => setAll("A")}>All Absent</Button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2 text-xs mb-2">
          <div className="rounded-md bg-lnx-green-500/10 text-lnx-green-500 py-1 text-center font-semibold">Present {counts.P}</div>
          <div className="rounded-md bg-lnx-red-500/10 text-lnx-red-500 py-1 text-center font-semibold">Absent {counts.A}</div>
          <div className="rounded-md bg-lnx-amber-500/10 text-lnx-amber-500 py-1 text-center font-semibold">Leave {counts.L}</div>
          <div className="rounded-md bg-muted py-1 text-center font-semibold">Medical {counts.ML}</div>
        </div>
        <div className="max-h-[50vh] overflow-y-auto -mx-6 px-6 divide-y">
          {filtered.map(s => (
            <div key={s.id} className="flex items-center gap-3 py-2">
              <Avatar firstName={s.firstName} lastName={s.lastName} color={s.avatarColor} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.firstName} {s.lastName}</p>
                <p className="text-xs text-muted-foreground">{s.rollNo} · Cumulative {s.attendancePct}%</p>
              </div>
              <div className="flex gap-1">
                {MARKS.map(m => (
                  <button key={m} disabled={locked} onClick={() => setMarks(prev => ({ ...prev, [s.id]: m }))}
                    className={cn("h-8 w-9 rounded-md border text-xs font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed", marks[s.id] === m ? markStyle[m] : "border-border text-muted-foreground hover:border-foreground")}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{locked ? "Close" : "Cancel"}</Button>
          {!locked && <Button onClick={submit}><Save className="h-4 w-4 mr-2" />Submit for HOD Approval</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══ Correction Dialog (prefilled) ══════════════════════════════════════
function CorrectionDialog({
  onClose, prefill, raisedBy, raisedByRole,
}: {
  onClose: () => void;
  prefill: { sectionId: string; subjectId: string; date: string; slot: number; facultyId: string; facultyName: string; studentId?: string };
  raisedBy: string;
  raisedByRole: "student" | "parent" | "faculty" | "lab_faculty";
}) {
  const users = useUsersStore(s => s.users);
  const attendance = useAcademicStore(s => s.attendance);
  const addCorrection = useAttendanceWorkflow(s => s.addCorrection);
  const addAudit = useAccessStore(s => s.addAudit);

  const roster = users.filter(u => u.role === "student" && u.sectionId === prefill.sectionId);
  const [studentId, setStudentId] = useState(prefill.studentId ?? roster[0]?.id ?? "");
  const [type, setType] = useState<CorrectionType>("technical");
  const [reason, setReason] = useState("");

  const record = attendance.find(a => a.sectionId === prefill.sectionId && a.subjectId === prefill.subjectId && a.date === prefill.date && a.slot === prefill.slot);
  const currentMark = (record?.marks[studentId] as Mark | undefined) ?? "A";
  const student = users.find(u => u.id === studentId);
  const { start, end } = slotTime(prefill.slot);

  const submit = () => {
    addCorrection({
      id: `cor_${Date.now().toString(36)}`,
      raisedBy, raisedByRole,
      studentId, studentName: `${student?.firstName ?? ""} ${student?.lastName ?? ""}`.trim(),
      rollNo: student?.rollNo,
      sectionId: prefill.sectionId, subjectId: prefill.subjectId,
      facultyId: prefill.facultyId, facultyName: prefill.facultyName,
      date: prefill.date, slot: prefill.slot, startTime: start, endTime: end,
      currentMark, correctionType: type, reason,
      raisedAt: new Date().toISOString(),
      // Faculty & students raise → faculty reviews first, then HOD.
      // Faculty raising a correction on their own record goes straight to HOD.
      status: raisedByRole === "faculty" || raisedByRole === "lab_faculty" ? "pending_hod" : "pending_faculty",
    });
    addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: raisedBy, module: "Attendance", action: "Raised correction request", targetId: studentId, reason });
    toast.success("Correction submitted", { description: raisedByRole === "student" || raisedByRole === "parent" ? "Routed to faculty first, then HOD." : "Routed to HOD for review." });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Raise attendance correction</DialogTitle>
          <DialogDescription>Context is prefilled from the record. Add a reason and choose the correction type.</DialogDescription>
        </DialogHeader>
        <div className="rounded-md border p-3 bg-muted/40 text-xs space-y-1">
          <p><b>Faculty:</b> {prefill.facultyName || "—"}</p>
          <p><b>Section:</b> {prefill.sectionId} · <b>Date:</b> {prefill.date} · <b>Time:</b> {start}–{end}</p>
          <p><b>Current status:</b> <Badge variant="secondary" className={cn(markStyle[currentMark], "border-0")}>{markLabel[currentMark]}</Badge></p>
        </div>
        <div className="grid gap-3">
          {!prefill.studentId && (
            <div><Label className="text-xs">Student</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{roster.map(r => <SelectItem key={r.id} value={r.id}>{r.rollNo} · {r.firstName} {r.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div><Label className="text-xs">Correction type</Label>
            <Select value={type} onValueChange={(v) => setType(v as CorrectionType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="technical">Technical Error</SelectItem>
                <SelectItem value="wrong_student">Wrong Student</SelectItem>
                <SelectItem value="late_entry">Late Entry</SelectItem>
                <SelectItem value="duplicate">Duplicate Entry</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Reason</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe what needs correcting…" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!reason.trim() || !studentId} onClick={submit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LeaveDialog({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (p: { from: string; to: string; reason: string }) => void }) {
  const [from, setFrom] = useState(new Date().toISOString().slice(0,10));
  const [to, setTo] = useState(new Date().toISOString().slice(0,10));
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Apply for leave</DialogTitle><DialogDescription>Sent to HOD for approval. Classes during the leave window will be flagged for substitution.</DialogDescription></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label className="text-xs">From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label className="text-xs">To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </div>
        <div><Label className="text-xs">Reason</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!reason.trim()} onClick={() => { onSubmit({ from, to, reason }); onClose(); setReason(""); }}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══ Student / Parent self-service view ═════════════════════════════════
function StudentSelfView({ userId, viewer }: { userId: string; viewer?: "parent" }) {
  const users = useUsersStore(s => s.users);
  const subjects = useAcademicStore(s => s.subjects);
  const attendance = useAcademicStore(s => s.attendance);         // APPROVED only
  const addAudit = useAccessStore(s => s.addAudit);
  const { user } = useAccess();
  const student = users.find(u => u.id === userId);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [subjectDrill, setSubjectDrill] = useState<string | null>(null);
  const [correctionSeed, setCorrectionSeed] = useState<{ subjectId: string; date: string; slot: number; sectionId: string; facultyId: string; facultyName: string } | null>(null);

  // Only APPROVED records reach students / parents (academicStore.attendance is
  // written by HOD approval via saveAttendanceCascade).
  const myRecords = useMemo(() => attendance.filter(a => a.marks[userId] !== undefined), [attendance, userId]);
  const overall = student?.attendancePct ?? 0;

  const subjWise = useMemo(() => {
    const map: Record<string, { p: number; a: number; l: number; ml: number; total: number }> = {};
    myRecords.forEach(r => {
      const m = r.marks[userId];
      if (!map[r.subjectId]) map[r.subjectId] = { p: 0, a: 0, l: 0, ml: 0, total: 0 };
      map[r.subjectId].total++;
      if (m === "P") map[r.subjectId].p++;
      else if (m === "A") map[r.subjectId].a++;
      else if (m === "L") map[r.subjectId].l++;
      else if (m === "ML") map[r.subjectId].ml++;
    });
    return Object.entries(map).map(([subId, v]) => ({
      subId, sub: subjects.find(s => s.id === subId), ...v,
      pct: v.total ? Math.round((v.p + v.ml) / v.total * 100) : 0,
    }));
  }, [myRecords, subjects, userId]);

  const calendarDays = useMemo(() => {
    const days: { date: string; status: "present"|"absent"|"partial"|"holiday" }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0,10);
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { days.push({ date: iso, status: "holiday" }); continue; }
      const recs = myRecords.filter(r => r.date === iso);
      if (!recs.length) { days.push({ date: iso, status: "holiday" }); continue; }
      const marks = recs.map(r => r.marks[userId]);
      const anyAbsent = marks.some(m => m === "A");
      const allPresent = marks.every(m => m === "P" || m === "ML");
      days.push({ date: iso, status: allPresent ? "present" : anyAbsent ? (marks.every(m => m === "A") ? "absent" : "partial") : "partial" });
    }
    return days;
  }, [myRecords, userId]);

  const shortage = overall < 75;
  const canRaise = viewer !== "parent" && user?.role === "student";

  const download = () => {
    const rows = ["Subject Code,Subject,Present,Absent,Leave,Medical,Total,Attendance %"];
    subjWise.forEach(s => rows.push(`${s.sub?.code ?? ""},${s.sub?.name ?? ""},${s.p},${s.a},${s.l},${s.ml},${s.total},${s.pct}%`));
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `attendance-${student?.rollNo ?? userId}.csv`; a.click();
    URL.revokeObjectURL(url);
    addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? userId, module: "Attendance", action: `Downloaded attendance report for ${student?.firstName} ${student?.lastName}` });
  };

  const drillRecords = subjectDrill ? myRecords.filter(r => r.subjectId === subjectDrill).sort((a,b) => b.date.localeCompare(a.date)) : [];
  const drillSubject = subjectDrill ? subjects.find(s => s.id === subjectDrill) : null;

  return (
    <div>
      <PageHeader
        title={viewer === "parent" ? `${student?.firstName ?? "Ward"}'s Attendance` : "My Attendance"}
        subtitle={student ? `${student.rollNo} · ${student.sectionId} · ${student.department}` : ""}
        action={
          <div className="flex gap-2">
            {canRaise && <Button variant="outline" onClick={() => setLeaveOpen(true)}><CalendarDays className="h-4 w-4 mr-2" />Request Leave</Button>}
            <Button onClick={download}><Download className="h-4 w-4 mr-2" />Download Report</Button>
          </div>
        }
      />

      {shortage && (
        <Card className="p-4 mb-6 border-lnx-red-500/40 bg-lnx-red-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-lnx-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-lnx-red-500">Attendance shortage</p>
              <p className="text-xs text-muted-foreground mt-1">Current attendance is {overall}%. The minimum requirement is 75% to be eligible for end-semester examinations. Consider submitting a medical certificate if applicable.</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Overall" value={`${overall}%`} icon={TrendingUp} tone={overall >= 75 ? "green" : "red"} />
        <KpiCard label="Present days" value={myRecords.filter(r => r.marks[userId] === "P").length} icon={Check} tone="green" />
        <KpiCard label="Absent days" value={myRecords.filter(r => r.marks[userId] === "A").length} icon={X} tone="red" />
        <KpiCard label="Subjects" value={subjWise.length} icon={FileText} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">Subject-wise attendance</h3>
          <p className="text-[11px] text-muted-foreground -mt-2 mb-3">Click a subject to see every class · only approved records shown.</p>
          <div className="space-y-3">
            {subjWise.map(s => (
              <button key={s.subId} onClick={() => setSubjectDrill(s.subId)} className="w-full text-left hover:bg-muted/40 rounded-md p-2 -m-2 transition">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{s.sub?.code} · {s.sub?.name}</span>
                  <Badge variant="secondary" className={attendanceBadge(s.pct)}>{s.pct}%</Badge>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={cn("h-full", s.pct >= 80 ? "bg-lnx-green-500" : s.pct >= 75 ? "bg-lnx-teal-500" : s.pct >= 65 ? "bg-lnx-amber-500" : "bg-lnx-red-500")} style={{ width: `${s.pct}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Present {s.p} · Absent {s.a} · Leave {s.l} · Medical {s.ml} · Total {s.total}</p>
              </button>
            ))}
            {subjWise.length === 0 && <EmptyState title="No records yet" body="Attendance will appear once faculty submissions are approved." />}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">Last 30 days</h3>
          <div className="grid grid-cols-10 gap-1.5">
            {calendarDays.map(d => (
              <div key={d.date} title={`${d.date} — ${d.status}`}
                className={cn("aspect-square rounded-sm",
                  d.status === "present" ? "bg-lnx-green-500" :
                  d.status === "absent" ? "bg-lnx-red-500" :
                  d.status === "partial" ? "bg-lnx-amber-500" :
                  "bg-muted")} />
            ))}
          </div>
          <div className="flex items-center gap-3 mt-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><div className="h-3 w-3 rounded-sm bg-lnx-green-500" />Present</span>
            <span className="flex items-center gap-1"><div className="h-3 w-3 rounded-sm bg-lnx-amber-500" />Partial</span>
            <span className="flex items-center gap-1"><div className="h-3 w-3 rounded-sm bg-lnx-red-500" />Absent</span>
            <span className="flex items-center gap-1"><div className="h-3 w-3 rounded-sm bg-muted" />Off</span>
          </div>
        </Card>
      </div>

      <Card className="p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-sm font-semibold">Recent history</h3>
          <Badge variant="secondary">{myRecords.length} records</Badge>
        </div>
        {myRecords.length === 0 ? <div className="p-8"><EmptyState title="No attendance recorded" body="Approved records will begin appearing here shortly." /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Subject</TableHead><TableHead>Time</TableHead><TableHead>Status</TableHead>{canRaise && <TableHead></TableHead>}</TableRow></TableHeader>
            <TableBody>
              {myRecords.slice(0, 30).map(r => {
                const sub = subjects.find(s => s.id === r.subjectId);
                const m = r.marks[userId];
                const { start, end } = slotTime(r.slot);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{r.date}</TableCell>
                    <TableCell>{sub?.code} · {sub?.name}</TableCell>
                    <TableCell className="text-xs">{start}–{end}</TableCell>
                    <TableCell><Badge variant="secondary" className={cn(markStyle[m as Mark], "border-0")}>{markLabel[m as Mark]}</Badge></TableCell>
                    {canRaise && (
                      <TableCell>
                        {m === "A" && <Button size="sm" variant="ghost" onClick={() => setCorrectionSeed({
                          subjectId: r.subjectId, date: r.date, slot: r.slot, sectionId: r.sectionId,
                          facultyId: r.facultyId,
                          facultyName: users.find(u => u.id === r.facultyId)?.firstName + " " + (users.find(u => u.id === r.facultyId)?.lastName ?? ""),
                        })}><MessageSquare className="h-3 w-3 mr-1" />Raise</Button>}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Subject drill drawer */}
      <Sheet open={!!subjectDrill} onOpenChange={(v) => !v && setSubjectDrill(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{drillSubject?.code} · {drillSubject?.name}</SheetTitle>
            <SheetDescription>All approved sessions for this subject.</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead>Status</TableHead>{canRaise && <TableHead></TableHead>}</TableRow></TableHeader>
              <TableBody>
                {drillRecords.map(r => {
                  const m = r.marks[userId] as Mark;
                  const { start, end } = slotTime(r.slot);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{r.date}</TableCell>
                      <TableCell className="text-xs">{start}–{end}</TableCell>
                      <TableCell><Badge variant="secondary" className={cn(markStyle[m], "border-0")}>{markLabel[m]}</Badge></TableCell>
                      {canRaise && (
                        <TableCell>
                          {m === "A" && <Button size="sm" variant="ghost" onClick={() => {
                            const fac = users.find(u => u.id === r.facultyId);
                            setCorrectionSeed({
                              subjectId: r.subjectId, date: r.date, slot: r.slot, sectionId: r.sectionId,
                              facultyId: r.facultyId,
                              facultyName: `${fac?.firstName ?? ""} ${fac?.lastName ?? ""}`.trim(),
                            });
                          }}><MessageSquare className="h-3 w-3 mr-1" />Raise</Button>}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </SheetContent>
      </Sheet>

      {correctionSeed && canRaise && (
        <CorrectionDialog
          onClose={() => setCorrectionSeed(null)}
          prefill={{ ...correctionSeed, studentId: userId }}
          raisedBy={user?.id ?? userId}
          raisedByRole="student"
        />
      )}

      <LeaveDialog open={leaveOpen} onClose={() => setLeaveOpen(false)} onSubmit={(payload) => {
        addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? userId, module: "Attendance", action: "Student leave request submitted", reason: payload.reason });
        toast.success("Leave request submitted", { description: "Your class advisor will review it shortly." });
      }} />
    </div>
  );
}
