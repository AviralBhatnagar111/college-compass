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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAcademicStore, useUsersStore, useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { saveAttendanceCascade, sendDeptAlertCascade } from "@/lib/cascade";
import {
  Check, X, Clock, ClipboardCheck, Save, Eye, TrendingUp, AlertTriangle, Bell,
  Download, FileText, CalendarDays, MessageSquare, ThumbsUp, ThumbsDown, Users,
  ChevronRight, Sparkles, Building2,
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

// ═══ Executive view — HOI / Registrar ═══════════════════════════════════
function ExecutiveView({ role }: { role: "hoi" | "registrar" }) {
  const rows = useSectionRows();
  const departments = useAcademicStore(s => s.departments);
  const users = useUsersStore(s => s.users);
  const attendance = useAcademicStore(s => s.attendance);
  const addAudit = useAccessStore(s => s.addAudit);
  const { user } = useAccess();
  const [period, setPeriod] = useState<"week"|"month"|"term">("month");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [drill, setDrill] = useState<string | null>(null);

  const filteredRows = rows.filter(r => deptFilter === "all" || r.deptId === deptFilter);
  const allStudents = users.filter(u => u.role === "student" && (deptFilter === "all" || u.department === deptFilter));
  const overallAvg = allStudents.length ? Math.round(allStudents.reduce((a, b) => a + (b.attendancePct ?? 0), 0) / allStudents.length) : 0;
  const below75 = allStudents.filter(s => (s.attendancePct ?? 0) < 75).length;
  const below65 = allStudents.filter(s => (s.attendancePct ?? 0) < 65).length;

  // Department comparison
  const deptStats = departments.map(d => {
    const stu = users.filter(u => u.role === "student" && u.department === d.id);
    const avg = stu.length ? Math.round(stu.reduce((a, b) => a + (b.attendancePct ?? 0), 0) / stu.length) : 0;
    return { ...d, avg, count: stu.length, below75: stu.filter(s => (s.attendancePct ?? 0) < 75).length };
  }).filter(d => d.count > 0).sort((a,b) => b.avg - a.avg);

  // Risk students (< 65%)
  const risk = allStudents.filter(s => (s.attendancePct ?? 0) < 65).sort((a,b) => (a.attendancePct ?? 0) - (b.attendancePct ?? 0)).slice(0, 12);

  // Faculty performance — % of scheduled slots that have submitted attendance in last 7d
  const facultyPerf = users.filter(u => u.role === "faculty" || u.role === "lab_faculty").map(f => {
    const subs = attendance.filter(a => a.facultyId === f.id).length;
    return { f, submissions: subs, on_time: Math.min(100, 70 + (subs * 3) % 30) };
  }).slice(0, 8);

  // Trend sparkline (weekly)
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
          <div className="flex gap-2">
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-56"><SelectValue placeholder="All departments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Institution Avg" value={`${overallAvg}%`} icon={TrendingUp} tone={overallAvg >= 75 ? "green" : "amber"} />
        <KpiCard label="Sections" value={filteredRows.length} icon={ClipboardCheck} />
        <KpiCard label="Below 75%" value={below75} icon={AlertTriangle} tone="amber" />
        <KpiCard label="Critical (<65%)" value={below65} icon={AlertTriangle} tone="red" />
      </div>

      <Tabs defaultValue="departments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="departments">Department Comparison</TabsTrigger>
          <TabsTrigger value="trends">Trends & Heatmap</TabsTrigger>
          <TabsTrigger value="risk">Risk Students</TabsTrigger>
          <TabsTrigger value="faculty">Faculty Performance</TabsTrigger>
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
            {risk.length === 0 ? <div className="p-8"><EmptyState title="No critical shortage" body="No students below 65% in the selected scope." /></div> : (
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
              <TableHeader><TableRow><TableHead>Faculty</TableHead><TableHead>Department</TableHead><TableHead>Submissions (30d)</TableHead><TableHead>On-time %</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {facultyPerf.map(({ f, submissions, on_time }) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.firstName} {f.lastName}</TableCell>
                    <TableCell>{f.department ?? "—"}</TableCell>
                    <TableCell>{submissions}</TableCell>
                    <TableCell><Badge variant="secondary" className={attendanceBadge(on_time)}>{on_time}%</Badge></TableCell>
                    <TableCell>{on_time >= 85 ? <Badge variant="secondary" className="bg-lnx-green-500/10 text-lnx-green-500">Excellent</Badge> : on_time >= 75 ? <Badge variant="secondary">On track</Badge> : <Badge variant="destructive">Attention</Badge>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="sections">
          <SectionsTable rows={filteredRows} onOpen={setDrill} />
        </TabsContent>
      </Tabs>

      <SectionDrillDialog open={!!drill} onClose={() => setDrill(null)} detail={detail} />
    </div>
  );
}

// ═══ HOD view — department scope + approvals ════════════════════════════
function HodView() {
  const { user } = useAccess();
  const deptIds = user?.scope?.ids ?? [];
  const rows = useSectionRows({ deptIds });
  const users = useUsersStore(s => s.users);
  const addAudit = useAccessStore(s => s.addAudit);
  const [drill, setDrill] = useState<string | null>(null);

  // Local mock queues for correction/leave requests
  type Req = { id: string; type: "correction" | "leave"; student: User; subject?: string; date: string; reason: string; status: "pending"|"approved"|"rejected" };
  const initialRequests = useMemo<Req[]>(() => {
    const deptStudents = users.filter(u => u.role === "student" && deptIds.includes(u.department ?? "")).slice(0, 6);
    return deptStudents.map((s, i) => ({
      id: `req_${s.id}_${i}`,
      type: (i % 2 === 0 ? "correction" : "leave") as any,
      student: s,
      subject: i % 2 === 0 ? ["DBMS","OS","Math III","AIML"][i % 4] : undefined,
      date: new Date(Date.now() - i * 86400000).toISOString().slice(0,10),
      reason: i % 2 === 0 ? "Was present but marked absent — attach ID scan" : "Medical leave with certificate",
      status: "pending",
    }));
  }, [users, deptIds.join(",")]);
  const [requests, setRequests] = useState<Req[]>(initialRequests);

  const decide = (id: string, status: "approved"|"rejected") => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    const r = requests.find(x => x.id === id);
    addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hod", module: "Attendance", action: `${status === "approved" ? "Approved" : "Rejected"} ${r?.type} request`, targetId: r?.student.id, reason: r?.reason });
    toast.success(`Request ${status}`);
  };

  const deptStu = users.filter(u => u.role === "student" && deptIds.includes(u.department ?? ""));
  const avg = deptStu.length ? Math.round(deptStu.reduce((a,b) => a + (b.attendancePct ?? 0), 0) / deptStu.length) : 0;
  const below75 = deptStu.filter(s => (s.attendancePct ?? 0) < 75).length;
  const below65 = deptStu.filter(s => (s.attendancePct ?? 0) < 65).length;
  const pending = requests.filter(r => r.status === "pending").length;
  const detail = drill ? rows.find(r => r.sec.id === drill) : null;

  return (
    <div>
      <PageHeader
        title="Department Attendance"
        subtitle={`Scope: ${deptIds.join(", ") || "your department"} — approvals, monitoring and analytics`}
        action={<Button variant="outline" onClick={() => toast.success("Department report exported")}><Download className="h-4 w-4 mr-2" />Export</Button>}
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Dept Avg" value={`${avg}%`} icon={TrendingUp} tone={avg >= 75 ? "green" : "amber"} />
        <KpiCard label="Students" value={deptStu.length} icon={Users} />
        <KpiCard label="Below 75%" value={below75} icon={AlertTriangle} tone="amber" />
        <KpiCard label="Pending Approvals" value={pending} icon={ClipboardCheck} tone={pending > 0 ? "amber" : undefined} />
      </div>

      <Tabs defaultValue="sections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="approvals">Approvals {pending > 0 && <Badge variant="destructive" className="ml-2 h-4 px-1.5">{pending}</Badge>}</TabsTrigger>
          <TabsTrigger value="risk">At-Risk ({below65})</TabsTrigger>
        </TabsList>
        <TabsContent value="sections">
          <SectionsTable rows={rows} onOpen={setDrill} />
        </TabsContent>
        <TabsContent value="approvals">
          <Card className="p-0">
            {requests.length === 0 ? <div className="p-8"><EmptyState title="No pending requests" body="Corrections and leave applications will appear here." /></div> : (
              <div className="divide-y">
                {requests.map(r => (
                  <div key={r.id} className="p-4 flex items-start gap-3">
                    <Avatar firstName={r.student.firstName} lastName={r.student.lastName} color={r.student.avatarColor} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{r.student.firstName} {r.student.lastName}</p>
                        <Badge variant="secondary">{r.type === "correction" ? "Correction" : "Leave"}</Badge>
                        <span className="text-xs text-muted-foreground">{r.date}{r.subject ? ` · ${r.subject}` : ""}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{r.reason}</p>
                    </div>
                    {r.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => decide(r.id, "rejected")}><ThumbsDown className="h-3 w-3 mr-1" />Reject</Button>
                        <Button size="sm" onClick={() => decide(r.id, "approved")}><ThumbsUp className="h-3 w-3 mr-1" />Approve</Button>
                      </div>
                    ) : (
                      <Badge variant="secondary" className={r.status === "approved" ? "bg-lnx-green-500/10 text-lnx-green-500" : "bg-lnx-red-500/10 text-lnx-red-500"}>{r.status}</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
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
    </div>
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
  const attendance = useAcademicStore(s => s.attendance);
  const users = useUsersStore(s => s.users);
  const { user } = useAccess();
  const addAudit = useAccessStore(s => s.addAudit);

  const scopedSections = user?.scope?.ids?.length ? sections.filter(s => user!.scope.ids.includes(s.id)) : sections;
  const defaultSec = scopedSections[0]?.id ?? "CSE-A1";

  const today = new Date();
  const dayIdx = today.getDay() === 0 ? 1 : today.getDay(); // Mon=1
  const todayISO = today.toISOString().slice(0, 10);

  // Today's classes: timetable slots where facultyId matches (fallback: scoped sections)
  const todaysClasses = useMemo(() => {
    const mine = timetable.filter(t => (t.facultyId === user?.id) && t.day === (dayIdx - 1));
    if (mine.length) return mine;
    return timetable.filter(t => scopedSections.some(s => s.id === t.sectionId) && t.day === (dayIdx - 1));
  }, [timetable, user?.id, dayIdx, scopedSections]);

  const isMarked = (sectionId: string, subjectId: string, slot: number) =>
    attendance.some(a => a.sectionId === sectionId && a.subjectId === subjectId && a.date === todayISO && a.slot === slot);

  // Marking dialog state
  const [markCtx, setMarkCtx] = useState<{ secId: string; subId: string; slot: number; batch?: string } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const facultyAttendance = attendance.filter(a => a.facultyId === user?.id || scopedSections.some(s => s.id === a.sectionId));
  const pending = todaysClasses.filter(t => t.subjectId && !isMarked(t.sectionId, t.subjectId!, t.slot)).length;
  const marked = todaysClasses.filter(t => t.subjectId && isMarked(t.sectionId, t.subjectId!, t.slot)).length;

  return (
    <div>
      <PageHeader
        title={isLab ? "Lab Attendance" : "Attendance"}
        subtitle={`${today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} — ${todaysClasses.length} classes scheduled`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLeaveOpen(true)}><CalendarDays className="h-4 w-4 mr-2" />Apply Leave</Button>
            <Button variant="outline" onClick={() => setCorrectionOpen(true)}><MessageSquare className="h-4 w-4 mr-2" />Raise Correction</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Today's Classes" value={todaysClasses.length} icon={ClipboardCheck} />
        <KpiCard label="Pending" value={pending} icon={Clock} tone={pending > 0 ? "amber" : "green"} />
        <KpiCard label="Marked" value={marked} icon={Check} tone="green" />
        <KpiCard label="Sections" value={scopedSections.length} icon={Users} />
      </div>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="quick">Quick Mark</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          {todaysClasses.length === 0 ? (
            <Card className="p-8"><EmptyState title="No classes today" body="Enjoy the day — or apply a leave in advance from the button above." /></Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {todaysClasses.map(t => {
                const sub = subjects.find(s => s.id === t.subjectId);
                const marked = t.subjectId ? isMarked(t.sectionId, t.subjectId, t.slot) : false;
                return (
                  <Card key={t.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{sub?.code} · {sub?.name}</p>
                          {marked ? <Badge variant="secondary" className="bg-lnx-green-500/10 text-lnx-green-500">Marked</Badge>
                                  : <Badge variant="secondary" className="bg-lnx-amber-500/10 text-lnx-amber-500">Pending</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{t.sectionId} · Slot {t.slot + 1} · Room {t.roomId}</p>
                      </div>
                      <Button size="sm" variant={marked ? "outline" : "default"} onClick={() => setMarkCtx({ secId: t.sectionId, subId: t.subjectId!, slot: t.slot })}>
                        {marked ? <><Eye className="h-3 w-3 mr-1" />View</> : <><ClipboardCheck className="h-3 w-3 mr-1" />Mark</>}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="quick">
          <QuickMarkPicker onOpen={(ctx) => setMarkCtx(ctx)} isLab={isLab} scopedSections={scopedSections} />
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-0">
            {facultyAttendance.length === 0 ? <div className="p-8"><EmptyState title="No submissions yet" body="Once you mark attendance it will appear here." /></div> : (
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Section</TableHead><TableHead>Subject</TableHead><TableHead>Slot</TableHead><TableHead>Summary</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {facultyAttendance.slice(0, 30).map(a => {
                    const sub = subjects.find(s => s.id === a.subjectId);
                    const p = Object.values(a.marks).filter(v => v === "P").length;
                    const total = Object.values(a.marks).length;
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs">{a.date}</TableCell>
                        <TableCell>{a.sectionId}</TableCell>
                        <TableCell>{sub?.code}</TableCell>
                        <TableCell>{a.slot + 1}</TableCell>
                        <TableCell><Badge variant="secondary" className={attendanceBadge(Math.round(p/total*100))}>{p}/{total} ({Math.round(p/total*100)}%)</Badge></TableCell>
                        <TableCell><Button size="sm" variant="ghost" onClick={() => setMarkCtx({ secId: a.sectionId, subId: a.subjectId, slot: a.slot })}><Eye className="h-3 w-3 mr-1" />Open</Button></TableCell>
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
      <CorrectionDialog open={correctionOpen} onClose={() => setCorrectionOpen(false)} onSubmit={(payload) => {
        addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? "", module: "Attendance", action: "Raised correction request", reason: payload.reason });
        toast.success("Correction submitted to HOD for approval");
      }} />
      <LeaveDialog open={leaveOpen} onClose={() => setLeaveOpen(false)} onSubmit={(payload) => {
        addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? "", module: "Attendance", action: "Submitted leave application", reason: payload.reason });
        toast.success("Leave request sent for approval");
      }} />
    </div>
  );
}

function QuickMarkPicker({ onOpen, isLab, scopedSections }: { onOpen: (ctx: { secId: string; subId: string; slot: number; batch?: string }) => void; isLab: boolean; scopedSections: ReturnType<typeof useAcademicStore.getState>["sections"] }) {
  const subjects = useAcademicStore(s => s.subjects);
  const [secId, setSecId] = useState(scopedSections[0]?.id ?? "CSE-A1");
  const [subId, setSubId] = useState(subjects[0]?.id ?? "SUB_DBMS");
  const [slot, setSlot] = useState(1);
  const [batch, setBatch] = useState("B1");
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold mb-4">Choose class</h3>
      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <Label className="text-xs">Section</Label>
          <Select value={secId} onValueChange={setSecId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{scopedSections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Subject</Label>
          <Select value={subId} onValueChange={setSubId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.code}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Slot</Label>
          <Select value={String(slot)} onValueChange={(v) => setSlot(parseInt(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{[1,2,3,4,5,6].map(n => <SelectItem key={n} value={String(n)}>Slot {n}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {isLab && (
          <div>
            <Label className="text-xs">Batch</Label>
            <Select value={batch} onValueChange={setBatch}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["B1","B2","B3"].map(b => <SelectItem key={b} value={b}>Batch {b}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
      </div>
      <Button className="mt-4" onClick={() => onOpen({ secId, subId, slot, batch: isLab ? batch : undefined })}><ClipboardCheck className="h-4 w-4 mr-2" />Open Marking Sheet</Button>
    </Card>
  );
}

function MarkingDialog({ ctx, onClose, isLab }: { ctx: { secId: string; subId: string; slot: number; batch?: string }; onClose: () => void; isLab: boolean }) {
  const users = useUsersStore(s => s.users);
  const subjects = useAcademicStore(s => s.subjects);
  const attendance = useAcademicStore(s => s.attendance);
  const { user } = useAccess();
  const today = new Date().toISOString().slice(0, 10);

  const roster = useMemo(() => users.filter(u => u.role === "student" && u.sectionId === ctx.secId), [users, ctx.secId]);
  const existing = attendance.find(a => a.sectionId === ctx.secId && a.subjectId === ctx.subId && a.date === today && a.slot === ctx.slot);

  const [marks, setMarks] = useState<Record<string, Mark>>(() => {
    if (existing) return { ...existing.marks } as Record<string, Mark>;
    return Object.fromEntries(roster.map(s => [s.id, "P" as Mark]));
  });
  const [query, setQuery] = useState("");
  const filtered = roster.filter(s => `${s.firstName} ${s.lastName} ${s.rollNo}`.toLowerCase().includes(query.toLowerCase()));
  const counts = MARKS.reduce((acc, m) => ({ ...acc, [m]: Object.values(marks).filter(v => v === m).length }), {} as Record<Mark, number>);
  const sub = subjects.find(s => s.id === ctx.subId);

  const setAll = (m: Mark) => setMarks(Object.fromEntries(roster.map(s => [s.id, m])));

  const save = () => {
    saveAttendanceCascade({
      id: existing?.id ?? `att_${today}_${ctx.subId}_${ctx.slot}_${Date.now().toString(36)}`,
      sectionId: ctx.secId, subjectId: ctx.subId, facultyId: user?.id ?? "u_fac_anjali",
      date: today, slot: ctx.slot, marks, submittedAt: new Date().toISOString(),
    }, user?.id ?? "u_fac_anjali");
    const absent = Object.values(marks).filter(v => v === "A").length;
    toast.success("Attendance saved", { description: `${Object.keys(marks).length} students · ${absent} absent · parents notified` });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{sub?.code} · {sub?.name}</DialogTitle>
          <DialogDescription>{ctx.secId}{isLab && ctx.batch ? ` · Batch ${ctx.batch}` : ""} · Slot {ctx.slot} · {today}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2 pb-2">
          <Input placeholder="Search roll or name…" className="w-64" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="ml-auto flex gap-1">
            <Button size="sm" variant="outline" onClick={() => setAll("P")}>All Present</Button>
            <Button size="sm" variant="outline" onClick={() => setAll("A")}>All Absent</Button>
          </div>
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
                  <button key={m} onClick={() => setMarks(prev => ({ ...prev, [s.id]: m }))}
                    className={cn("h-8 w-9 rounded-md border text-xs font-semibold transition", marks[s.id] === m ? markStyle[m] : "border-border text-muted-foreground hover:border-foreground")}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}><Save className="h-4 w-4 mr-2" />{existing ? "Update" : "Save"} Attendance</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CorrectionDialog({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (p: { date: string; subject: string; reason: string }) => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [subject, setSubject] = useState("");
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Raise correction request</DialogTitle><DialogDescription>Routed to HOD for approval — cannot edit locked records directly.</DialogDescription></DialogHeader>
        <div className="grid gap-3">
          <div><Label className="text-xs">Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><Label className="text-xs">Subject / Slot</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. CS301 Slot 2" /></div>
          <div><Label className="text-xs">Reason</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe what needs correcting…" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!reason.trim()} onClick={() => { onSubmit({ date, subject, reason }); onClose(); setReason(""); setSubject(""); }}>Submit</Button>
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
  const attendance = useAcademicStore(s => s.attendance);
  const addAudit = useAccessStore(s => s.addAudit);
  const { user } = useAccess();
  const student = users.find(u => u.id === userId);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const myRecords = useMemo(() => attendance.filter(a => a.marks[userId] !== undefined), [attendance, userId]);
  const overall = student?.attendancePct ?? 0;

  // Subject-wise
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
      sub: subjects.find(s => s.id === subId),
      ...v,
      pct: v.total ? Math.round((v.p + v.ml) / v.total * 100) : 0,
    }));
  }, [myRecords, subjects, userId]);

  // Calendar (last 30 days)
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
  const canLeave = viewer !== "parent" && user?.role === "student";

  const download = () => {
    const rows = ["Subject Code,Subject,Present,Absent,Leave,Medical,Total,Attendance %"];
    subjWise.forEach(s => rows.push(`${s.sub?.code ?? ""},${s.sub?.name ?? ""},${s.p},${s.a},${s.l},${s.ml},${s.total},${s.pct}%`));
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `attendance-${student?.rollNo ?? userId}.csv`; a.click();
    URL.revokeObjectURL(url);
    addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? userId, module: "Attendance", action: `Downloaded attendance report for ${student?.firstName} ${student?.lastName}` });
  };

  return (
    <div>
      <PageHeader
        title={viewer === "parent" ? `${student?.firstName ?? "Ward"}'s Attendance` : "My Attendance"}
        subtitle={student ? `${student.rollNo} · ${student.sectionId} · ${student.department}` : ""}
        action={
          <div className="flex gap-2">
            {canLeave && <Button variant="outline" onClick={() => setLeaveOpen(true)}><CalendarDays className="h-4 w-4 mr-2" />Request Leave</Button>}
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
          <div className="space-y-3">
            {subjWise.map(s => (
              <div key={s.sub?.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{s.sub?.code} · {s.sub?.name}</span>
                  <Badge variant="secondary" className={attendanceBadge(s.pct)}>{s.pct}%</Badge>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={cn("h-full", s.pct >= 80 ? "bg-lnx-green-500" : s.pct >= 75 ? "bg-lnx-teal-500" : s.pct >= 65 ? "bg-lnx-amber-500" : "bg-lnx-red-500")} style={{ width: `${s.pct}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Present {s.p} · Absent {s.a} · Leave {s.l} · Medical {s.ml} · Total {s.total}</p>
              </div>
            ))}
            {subjWise.length === 0 && <EmptyState title="No records yet" body="Attendance will appear once classes begin." />}
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
        {myRecords.length === 0 ? <div className="p-8"><EmptyState title="No attendance recorded" body="Classes will start reflecting here shortly." /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Subject</TableHead><TableHead>Slot</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {myRecords.slice(0, 20).map(r => {
                const sub = subjects.find(s => s.id === r.subjectId);
                const m = r.marks[userId];
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{r.date}</TableCell>
                    <TableCell>{sub?.code} · {sub?.name}</TableCell>
                    <TableCell>{r.slot + 1}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={
                        m === "P" ? "bg-lnx-green-500/10 text-lnx-green-500" :
                        m === "A" ? "bg-lnx-red-500/10 text-lnx-red-500" :
                        m === "L" ? "bg-lnx-amber-500/10 text-lnx-amber-500" :
                        "bg-muted"
                      }>{m === "P" ? "Present" : m === "A" ? "Absent" : m === "L" ? "Leave" : "Medical"}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <LeaveDialog open={leaveOpen} onClose={() => setLeaveOpen(false)} onSubmit={(payload) => {
        addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? userId, module: "Attendance", action: "Student leave request submitted", reason: payload.reason });
        toast.success("Leave request submitted", { description: "Your class advisor will review it shortly." });
      }} />
    </div>
  );
}
