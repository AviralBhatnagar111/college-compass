import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAcademicStore, useUsersStore, useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { saveAttendanceCascade, sendDeptAlertCascade } from "@/lib/cascade";
import { Check, X, Clock, ClipboardCheck, Save, Eye, TrendingUp, AlertTriangle, Bell } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";
import { KpiCard } from "@/components/common/KpiCard";
import { toast } from "sonner";

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

const OVERSIGHT_ROLES = ["hoi", "registrar", "exam_head", "hod"];

function AttendancePage() {
  const { user } = useAccess();
  if (user && OVERSIGHT_ROLES.includes(user.role)) return <MonitorView />;
  return <MarkingView />;
}

// ─── Marker view (faculty / lab faculty) ───────────────────────────────
function MarkingView() {
  const sections = useAcademicStore(s => s.sections);
  const subjects = useAcademicStore(s => s.subjects);
  const attendance = useAcademicStore(s => s.attendance);
  const users = useUsersStore(s => s.users);
  const { user } = useAccess();

  const [secId, setSecId] = useState("CSE-A1");
  const [subId, setSubId] = useState("SUB_DBMS");
  const students = useMemo(() => users.filter(u => u.role === "student" && u.sectionId === secId), [users, secId]);
  const today = new Date().toISOString().slice(0, 10);
  const [marks, setMarks] = useState<Record<string, Mark>>(() => Object.fromEntries(students.map(s => [s.id, "P" as Mark])));

  const counts = MARKS.reduce((acc, m) => ({ ...acc, [m]: Object.values(marks).filter(v => v === m).length }), {} as Record<Mark, number>);

  const handleSave = () => {
    saveAttendanceCascade({
      id: `att_${today}_${subId}_${Date.now().toString(36)}`, sectionId: secId, subjectId: subId,
      facultyId: user?.id ?? "u_fac_anjali", date: today, slot: 1, marks, submittedAt: new Date().toISOString(),
    }, user?.id ?? "u_fac_anjali");
    const absent = Object.values(marks).filter(v => v === "A").length;
    toast.success("Attendance saved", { description: `${Object.keys(marks).length} marked · ${absent} absent parents notified` });
  };

  const recent = attendance.filter(a => a.sectionId === secId).slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle={`Mark for ${secId} — ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}`}
        action={<Button onClick={handleSave}><Save className="h-4 w-4 mr-2" />Save Attendance</Button>}
        filters={
          <div className="flex gap-3">
            <Select value={secId} onValueChange={setSecId}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={subId} onValueChange={setSubId}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.code} · {s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        }
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Present" value={counts.P} icon={Check} tone="green" />
        <KpiCard label="Absent" value={counts.A} icon={X} tone="red" />
        <KpiCard label="Leave" value={counts.L} icon={Clock} tone="amber" />
        <KpiCard label="Medical" value={counts.ML} icon={ClipboardCheck} />
      </div>
      <Card className="p-0 mb-6">
        <div className="divide-y">
          {students.map(s => (
            <div key={s.id} className="flex items-center gap-3 p-3">
              <Avatar firstName={s.firstName} lastName={s.lastName} color={s.avatarColor} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.firstName} {s.lastName}</p>
                <p className="text-xs text-muted-foreground">{s.rollNo}</p>
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
      </Card>
      <h3 className="text-sm font-semibold mb-3">Recent submissions for {secId}</h3>
      <Card className="p-0">
        <div className="divide-y">
          {recent.map(a => {
            const sub = subjects.find(s => s.id === a.subjectId);
            const p = Object.values(a.marks).filter(v => v === "P").length;
            const total = Object.values(a.marks).length;
            return (
              <div key={a.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium">{sub?.code} · {sub?.name}</p>
                  <p className="text-xs text-muted-foreground">{a.date} · Slot {a.slot}</p>
                </div>
                <Badge variant="secondary">{p}/{total} present ({Math.round(p/total*100)}%)</Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── Oversight monitor (HOI / Registrar / Exam Head / HOD) ─────────────
function MonitorView() {
  const sections = useAcademicStore(s => s.sections);
  const programs = useAcademicStore(s => s.programs);
  const users = useUsersStore(s => s.users);
  const { user } = useAccess();
  const addAudit = useAccessStore(s => s.addAudit);
  const [open, setOpen] = useState<string | null>(null);

  // Aggregate per section
  const rows = sections.map(sec => {
    const stu = users.filter(u => u.role === "student" && u.sectionId === sec.id);
    const avg = stu.length ? Math.round(stu.reduce((a, b) => a + (b.attendancePct ?? 0), 0) / stu.length) : 0;
    const below75 = stu.filter(s => (s.attendancePct ?? 0) < 75).length;
    const below65 = stu.filter(s => (s.attendancePct ?? 0) < 65).length;
    const prog = programs.find(p => p.id === sec.programId);
    return { sec, stu, avg, below75, below65, prog };
  });
  const all = users.filter(u => u.role === "student");
  const overallAvg = all.length ? Math.round(all.reduce((a, b) => a + (b.attendancePct ?? 0), 0) / all.length) : 0;
  const totalBelow75 = all.filter(s => (s.attendancePct ?? 0) < 75).length;
  const totalBelow65 = all.filter(s => (s.attendancePct ?? 0) < 65).length;

  const detail = open ? rows.find(r => r.sec.id === open) : null;

  const nudgeSection = (sectionId: string) => {
    const r = rows.find(x => x.sec.id === sectionId);
    if (!r) return;
    sendDeptAlertCascade(r.prog?.departmentId ?? "CSE", `Attendance flagged for ${r.sec.name}: ${r.below75} students below 75%.`, user?.id ?? "u_hoi");
    addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hoi", module: "Attendance", action: `Flagged ${r.sec.name} to HOD`, reason: `${r.below75} students below 75%` });
    toast.success("HOD notified", { description: `${r.sec.name} attendance flagged` });
  };

  return (
    <div>
      <PageHeader title="Attendance Monitor" subtitle="Institution-wide oversight — read-only, drill into any section" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Avg attendance" value={`${overallAvg}%`} icon={TrendingUp} tone={overallAvg >= 75 ? "green" : "amber"} />
        <KpiCard label="Sections" value={sections.length} icon={ClipboardCheck} />
        <KpiCard label="Below 75%" value={totalBelow75} icon={AlertTriangle} tone="amber" />
        <KpiCard label="Critical (<65%)" value={totalBelow65} icon={AlertTriangle} tone="red" />
      </div>
      <Card className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Section</TableHead><TableHead>Program</TableHead><TableHead>Students</TableHead><TableHead>Avg Attendance</TableHead><TableHead>Below 75%</TableHead><TableHead>Critical</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.sec.id} className="cursor-pointer" onClick={() => setOpen(r.sec.id)}>
                <TableCell className="font-medium">{r.sec.name}</TableCell>
                <TableCell className="text-xs">{r.prog?.name ?? "—"}</TableCell>
                <TableCell>{r.stu.length}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={r.avg >= 80 ? "bg-lnx-green-500/10 text-lnx-green-500" : r.avg >= 70 ? "bg-lnx-amber-500/10 text-lnx-amber-500" : "bg-lnx-red-500/10 text-lnx-red-500"}>{r.avg}%</Badge>
                </TableCell>
                <TableCell>{r.below75}</TableCell>
                <TableCell>{r.below65 > 0 ? <Badge variant="destructive">{r.below65}</Badge> : <span className="text-xs text-muted-foreground">0</span>}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()} className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setOpen(r.sec.id)}><Eye className="h-3 w-3 mr-1" />View</Button>
                  {r.below75 > 0 && <Button size="sm" variant="outline" onClick={() => nudgeSection(r.sec.id)}><Bell className="h-3 w-3 mr-1" />Flag HOD</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
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
                      <TableCell>
                        <Link to="/people/students/$id" params={{ id: s.id }} className="hover:underline">{s.firstName} {s.lastName}</Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={(s.attendancePct ?? 0) >= 75 ? "bg-lnx-green-500/10 text-lnx-green-500" : (s.attendancePct ?? 0) >= 65 ? "bg-lnx-amber-500/10 text-lnx-amber-500" : "bg-lnx-red-500/10 text-lnx-red-500"}>{s.attendancePct ?? 0}%</Badge>
                      </TableCell>
                      <TableCell><Button asChild size="sm" variant="ghost"><Link to="/people/students/$id" params={{ id: s.id }}>Profile</Link></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
