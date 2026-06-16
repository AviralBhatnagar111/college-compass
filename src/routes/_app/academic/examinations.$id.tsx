import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useUsersStore, useAccessStore, useFinanceStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { publishResultsCascade, nadPushCascade } from "@/lib/cascade";
import { Lock, Send, UploadCloud, Loader2, CheckCircle2, FileText, ShieldAlert, Download, Printer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/academic/examinations/$id")({
  head: () => ({ meta: [{ title: "Exam Detail — LearnNowX" }] }),
  component: ExamDetail,
});

const EXAM_META: Record<string, { name: string; subject: string; code: string; section: string; max: number; date: string; duration: number; room: string }> = {
  EX1: { name: "Mid-Sem Internal-1", subject: "Database Management Systems", code: "CS301", section: "CSE-A1", max: 30, date: "2026-06-10", duration: 90, room: "LH-201" },
  EX2: { name: "Mid-Sem Internal-1", subject: "Operating Systems", code: "CS302", section: "CSE-A1", max: 30, date: "2026-06-12", duration: 90, room: "LH-202" },
  EX3: { name: "End-Semester", subject: "AI & Machine Learning", code: "CS303", section: "CSE-A1", max: 100, date: "2026-07-15", duration: 180, room: "LH-301" },
  EX4: { name: "Mid-Sem Internal-1", subject: "VLSI Design", code: "EC301", section: "ECE-B1", max: 30, date: "2026-06-08", duration: 90, room: "LH-104" },
  EX5: { name: "Quiz-1", subject: "Computer Networks", code: "CS304", section: "CSE-A1", max: 10, date: "2026-05-28", duration: 30, room: "LH-201" },
};

type EligibilityFlag = "ok" | "low_attendance" | "fee_due" | "blocked";

function ExamDetail() {
  const { id } = useParams({ from: "/_app/academic/examinations/$id" });
  const meta = EXAM_META[id] ?? EXAM_META.EX1;
  const { user } = useAccess();
  const addAudit = useAccessStore(s => s.addAudit);
  const ledger = useFinanceStore(s => s.ledger);
  const students = useUsersStore(s => s.users.filter(u => u.role === "student" && u.sectionId === meta.section));

  // Eligibility: low attendance (<75) or has outstanding ledger balance
  const baselineEligibility = useMemo(() => {
    const m: Record<string, EligibilityFlag> = {};
    students.forEach(s => {
      const lastBal = [...ledger].filter(l => l.studentId === s.id).pop()?.balance ?? 0;
      if ((s.attendancePct ?? 0) < 75) m[s.id] = "low_attendance";
      else if (lastBal > 0) m[s.id] = "fee_due";
      else m[s.id] = "ok";
    });
    return m;
  }, [students, ledger]);

  const [eligibility, setEligibility] = useState<Record<string, EligibilityFlag>>(baselineEligibility);
  const [overrides, setOverrides] = useState<Record<string, { reason: string; by: string; at: string }>>({});
  const [overrideOpen, setOverrideOpen] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState("");

  const [marks, setMarks] = useState<Record<string, string>>(
    () => Object.fromEntries(students.map(s => [s.id, String(Math.floor(meta.max * (0.55 + Math.random() * 0.4)))]))
  );
  const [locked, setLocked] = useState(false);
  const [published, setPublished] = useState(false);
  const [confirmLock, setConfirmLock] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [nadOpen, setNadOpen] = useState(false);
  const [nadPhase, setNadPhase] = useState<"idle" | "pushing" | "done">("idle");
  const [hallPreview, setHallPreview] = useState<string | null>(null);

  const filled = Object.values(marks).filter(v => v !== "").length;
  const pct = students.length ? Math.round((filled / students.length) * 100) : 0;
  const eligibleCount = students.filter(s => eligibility[s.id] === "ok" || overrides[s.id]).length;
  const blockedCount = students.length - eligibleCount;

  const flagLabel = (f: EligibilityFlag) => f === "ok" ? "Eligible" : f === "low_attendance" ? "Low attendance" : f === "fee_due" ? "Fee due" : "Blocked";
  const flagTone = (f: EligibilityFlag) => f === "ok" ? "bg-lnx-green-500/10 text-lnx-green-500" : "bg-lnx-red-500/10 text-lnx-red-500";

  const doLock = () => {
    setLocked(true); setConfirmLock(false);
    addAudit({ id: `a_${Date.now()}`, at: new Date().toISOString(), actorId: user?.id ?? "system", action: "exam.lock_marks", module: "academic", after: { exam: id, count: students.length } });
    toast.success("Marks locked", { description: "Further edits require HOI approval." });
  };
  const doPublish = () => {
    setPublished(true); setConfirmPublish(false);
    publishResultsCascade(meta.section, meta.name, user?.id ?? "u_hoi");
    toast.success("Results published", { description: `${students.length} students notified.` });
  };
  const runNad = () => {
    setNadOpen(true); setNadPhase("pushing");
    setTimeout(() => { setNadPhase("done"); nadPushCascade(meta.section, meta.name, user?.id ?? "u_hoi"); }, 2200);
  };
  const submitOverride = () => {
    if (!overrideOpen) return;
    if (!overrideReason.trim()) { toast.error("Reason required for override"); return; }
    setOverrides(p => ({ ...p, [overrideOpen]: { reason: overrideReason, by: user?.id ?? "system", at: new Date().toISOString() } }));
    addAudit({ id: `a_${Date.now()}`, at: new Date().toISOString(), actorId: user?.id ?? "system", targetId: overrideOpen, action: "exam.eligibility_override", module: "academic", reason: overrideReason, after: { exam: id } });
    toast.success("Eligibility override granted");
    setOverrideOpen(null); setOverrideReason("");
  };
  const blockStudent = (sid: string) => {
    setEligibility(p => ({ ...p, [sid]: "blocked" }));
    setOverrides(p => { const c = { ...p }; delete c[sid]; return c; });
    addAudit({ id: `a_${Date.now()}`, at: new Date().toISOString(), actorId: user?.id ?? "system", targetId: sid, action: "exam.block", module: "academic", after: { exam: id } });
    toast.success("Student blocked from exam");
  };
  const downloadAllHalls = () => {
    const csv = ["Roll,Name,Section,Subject,Date,Time,Room,Hall Ticket #"].concat(
      students.filter(s => eligibility[s.id] === "ok" || overrides[s.id]).map(s => `${s.rollNo},"${s.firstName} ${s.lastName}",${meta.section},${meta.code},${meta.date},09:30 AM,${meta.room},HT-${id}-${s.rollNo}`)
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `hall-tickets-${id}.csv`; a.click(); URL.revokeObjectURL(url);
    toast.success(`Downloaded ${eligibleCount} hall tickets`);
  };

  return (
    <div>
      <PageHeader
        title={`${meta.name} · ${meta.subject}`}
        subtitle={`${meta.code} · ${meta.section} · Max ${meta.max} marks · ${meta.date} · ${meta.duration} min · ${meta.room}`}
        action={<Badge variant="outline">{published ? "Published" : locked ? "Locked" : "Draft"}</Badge>}
      />
      <Tabs defaultValue="marks">
        <TabsList>
          <TabsTrigger value="marks">Marks Entry</TabsTrigger>
          <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
          <TabsTrigger value="hall">Hall Tickets</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="marks">
          <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-muted-foreground">{filled}/{students.length} entered ({pct}%)</p>
            <div className="flex gap-2">
              {!locked && <Button variant="outline" size="sm" onClick={() => setConfirmLock(true)}><Lock className="h-3 w-3 mr-1" />Lock Marks</Button>}
              {locked && !published && <Button size="sm" onClick={() => setConfirmPublish(true)}><Send className="h-3 w-3 mr-1" />Publish Results</Button>}
              {published && <Button size="sm" variant="outline" onClick={runNad}><UploadCloud className="h-3 w-3 mr-1" />Push to NAD</Button>}
            </div>
          </div>
          <Card className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Roll No</TableHead><TableHead>Student</TableHead><TableHead className="w-32">Marks / {meta.max}</TableHead><TableHead>Grade</TableHead></TableRow></TableHeader>
              <TableBody>
                {students.map(s => {
                  const m = parseInt(marks[s.id] || "0", 10);
                  const pctMark = (m / meta.max) * 100;
                  const grade = pctMark >= 85 ? "A+" : pctMark >= 75 ? "A" : pctMark >= 65 ? "B+" : pctMark >= 50 ? "B" : "F";
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.rollNo}</TableCell>
                      <TableCell>{s.firstName} {s.lastName}</TableCell>
                      <TableCell>
                        <Input type="number" max={meta.max} value={marks[s.id]} disabled={locked}
                          onChange={e => setMarks(p => ({ ...p, [s.id]: e.target.value }))} className="h-8 w-24" />
                      </TableCell>
                      <TableCell><Badge variant="secondary" className={grade === "F" ? "bg-lnx-red-500/10 text-lnx-red-500" : "bg-lnx-green-500/10 text-lnx-green-500"}>{grade}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="eligibility">
          <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-muted-foreground">
              <span className="text-lnx-green-500 font-medium">{eligibleCount} eligible</span> · <span className="text-lnx-red-500 font-medium">{blockedCount} blocked</span> · Auto-flagged by attendance &lt;75% or outstanding fees
            </p>
          </div>
          <Card className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Roll No</TableHead><TableHead>Student</TableHead><TableHead>Attendance</TableHead><TableHead>Status</TableHead><TableHead>Override</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {students.map(s => {
                  const flag = eligibility[s.id];
                  const ov = overrides[s.id];
                  const effective: EligibilityFlag = ov ? "ok" : flag;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.rollNo}</TableCell>
                      <TableCell>{s.firstName} {s.lastName}</TableCell>
                      <TableCell>{s.attendancePct}%</TableCell>
                      <TableCell><Badge variant="secondary" className={flagTone(effective)}>{flagLabel(effective)}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate">{ov ? `By HOI · ${ov.reason}` : "—"}</TableCell>
                      <TableCell className="text-right pr-3">
                        {flag !== "ok" && !ov && <Button size="sm" variant="outline" onClick={() => { setOverrideOpen(s.id); setOverrideReason(""); }}><ShieldAlert className="h-3 w-3 mr-1" />Override</Button>}
                        {(flag === "ok" || ov) && <Button size="sm" variant="ghost" onClick={() => blockStudent(s.id)}>Block</Button>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="hall">
          <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-muted-foreground">{eligibleCount} eligible · {blockedCount} blocked. Hall tickets carry photo, signature & exam centre.</p>
            <Button variant="outline" size="sm" onClick={downloadAllHalls}><Download className="h-3 w-3 mr-1" />Download all (CSV)</Button>
          </div>
          <Card className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Roll</TableHead><TableHead>Student</TableHead><TableHead>Hall Ticket #</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {students.map(s => {
                  const elig = eligibility[s.id] === "ok" || !!overrides[s.id];
                  const ht = `HT-${id}-${s.rollNo}`;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.rollNo}</TableCell>
                      <TableCell>{s.firstName} {s.lastName}</TableCell>
                      <TableCell className="font-mono text-xs">{elig ? ht : "—"}</TableCell>
                      <TableCell>{elig ? <Badge className="bg-lnx-green-500/10 text-lnx-green-500">Generated</Badge> : <Badge className="bg-lnx-red-500/10 text-lnx-red-500">Withheld</Badge>}</TableCell>
                      <TableCell className="text-right pr-3">
                        {elig && <Button size="sm" variant="ghost" onClick={() => setHallPreview(s.id)}><Printer className="h-3 w-3 mr-1" />Preview</Button>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card className="p-6 text-sm space-y-2">
            <Row k="Subject" v={`${meta.code} · ${meta.subject}`} />
            <Row k="Date" v={meta.date} />
            <Row k="Duration" v={`${meta.duration} min`} />
            <Row k="Centre" v={meta.room} />
            <Row k="Section" v={meta.section} />
            <Row k="Max marks" v={String(meta.max)} />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lock dialog */}
      <Dialog open={confirmLock} onOpenChange={setConfirmLock}>
        <DialogContent>
          <DialogHeader><DialogTitle>Lock marks?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Once locked, marks cannot be edited without HOI approval. This affects {students.length} students.</p>
          <DialogFooter><Button variant="outline" onClick={() => setConfirmLock(false)}>Cancel</Button><Button onClick={doLock}>Confirm lock</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish dialog */}
      <Dialog open={confirmPublish} onOpenChange={setConfirmPublish}>
        <DialogContent>
          <DialogHeader><DialogTitle>Publish results?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{students.length} students and their parents will be notified. Grade cards will be generated.</p>
          <DialogFooter><Button variant="outline" onClick={() => setConfirmPublish(false)}>Cancel</Button><Button onClick={doPublish}>Publish now</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Override dialog */}
      <Dialog open={!!overrideOpen} onOpenChange={(v) => !v && setOverrideOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Grant eligibility override</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">HOI override will be audit-logged. Student becomes eligible to sit the exam.</p>
          <Label className="mt-3">Reason</Label>
          <Textarea rows={3} value={overrideReason} onChange={e => setOverrideReason(e.target.value)} placeholder="Medical leave, on-duty NSS event, fee installment confirmed…" />
          <DialogFooter><Button variant="outline" onClick={() => setOverrideOpen(null)}>Cancel</Button><Button onClick={submitOverride}>Grant override</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NAD push */}
      <Dialog open={nadOpen} onOpenChange={(v) => { setNadOpen(v); if (!v) setNadPhase("idle"); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>National Academic Depository</DialogTitle></DialogHeader>
          {nadPhase === "pushing" && (
            <div className="py-8 flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-lnx-teal-500" />
              <p className="text-sm">Pushing {students.length} grade cards to NAD…</p>
            </div>
          )}
          {nadPhase === "done" && (
            <div className="py-6 text-center space-y-3">
              <div className="mx-auto h-14 w-14 rounded-full bg-lnx-green-500/15 flex items-center justify-center"><CheckCircle2 className="h-8 w-8 text-lnx-green-500" /></div>
              <p className="text-sm font-medium">Push complete</p>
              <p className="text-xs text-muted-foreground">{students.length} grade cards now available in students' DigiLocker.</p>
              <Button onClick={() => setNadOpen(false)}>Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hall ticket preview */}
      <Dialog open={!!hallPreview} onOpenChange={(v) => !v && setHallPreview(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Hall Ticket Preview</DialogTitle></DialogHeader>
          {hallPreview && (() => {
            const s = students.find(x => x.id === hallPreview);
            if (!s) return null;
            return (
              <div className="border rounded-md p-4 text-sm space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-lnx-navy-800">LearnNowX Institute</p>
                    <p className="text-[11px] text-muted-foreground">Examination Hall Ticket</p>
                  </div>
                  <FileText className="h-8 w-8 text-lnx-teal-500" />
                </div>
                <hr />
                <Row k="Name" v={`${s.firstName} ${s.lastName}`} />
                <Row k="Roll No" v={s.rollNo ?? "—"} />
                <Row k="Section" v={meta.section} />
                <Row k="Subject" v={`${meta.code} · ${meta.subject}`} />
                <Row k="Date" v={meta.date} />
                <Row k="Time" v="09:30 AM" />
                <Row k="Centre" v={meta.room} />
                <Row k="Ticket #" v={<span className="font-mono">HT-{id}-{s.rollNo}</span>} />
              </div>
            );
          })()}
          <DialogFooter><Button variant="outline" onClick={() => setHallPreview(null)}>Close</Button><Button onClick={() => { toast.success("Sent to printer"); setHallPreview(null); }}><Printer className="h-3 w-3 mr-1" />Print</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between text-sm"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>;
}
