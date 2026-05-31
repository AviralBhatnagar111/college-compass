import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useUsersStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { publishResultsCascade, nadPushCascade } from "@/lib/cascade";
import { Lock, Send, UploadCloud, Loader2, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/academic/examinations/$id")({
  head: () => ({ meta: [{ title: "Exam Detail — LearnNowX" }] }),
  component: ExamDetail,
});

const EXAM_META: Record<string, { name: string; subject: string; code: string; section: string; max: number }> = {
  EX1: { name: "Mid-Sem Internal-1", subject: "Database Management Systems", code: "CS301", section: "CSE-A1", max: 30 },
  EX2: { name: "Mid-Sem Internal-1", subject: "Operating Systems", code: "CS302", section: "CSE-A1", max: 30 },
  EX3: { name: "End-Semester", subject: "AI & Machine Learning", code: "CS303", section: "CSE-A1", max: 100 },
  EX4: { name: "Mid-Sem Internal-1", subject: "VLSI Design", code: "EC301", section: "ECE-B1", max: 30 },
  EX5: { name: "Quiz-1", subject: "Computer Networks", code: "CS304", section: "CSE-A1", max: 10 },
};

function ExamDetail() {
  const { id } = useParams({ from: "/_app/academic/examinations/$id" });
  const meta = EXAM_META[id] ?? EXAM_META.EX1;
  const { user } = useAccess();
  const students = useUsersStore(s => s.users.filter(u => u.role === "student" && u.sectionId === meta.section));

  const [marks, setMarks] = useState<Record<string, string>>(
    () => Object.fromEntries(students.map(s => [s.id, String(Math.floor(meta.max * (0.55 + Math.random() * 0.4)))]))
  );
  const [locked, setLocked] = useState(false);
  const [published, setPublished] = useState(false);
  const [confirmLock, setConfirmLock] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [nadOpen, setNadOpen] = useState(false);
  const [nadPhase, setNadPhase] = useState<"idle" | "pushing" | "done">("idle");

  const filled = Object.values(marks).filter(v => v !== "").length;
  const pct = Math.round((filled / students.length) * 100);

  const doLock = () => {
    setLocked(true); setConfirmLock(false);
    toast.success("Marks locked", { description: "Further edits require HOI approval." });
  };
  const doPublish = () => {
    setPublished(true); setConfirmPublish(false);
    publishResultsCascade(meta.section, meta.name, user?.id ?? "u_hoi");
    toast.success("Results published", { description: `${students.length} students notified.` });
  };
  const runNad = () => {
    setNadOpen(true); setNadPhase("pushing");
    setTimeout(() => {
      setNadPhase("done");
      nadPushCascade(meta.section, meta.name, user?.id ?? "u_hoi");
    }, 2400);
  };

  return (
    <div>
      <PageHeader
        title={`${meta.name} · ${meta.subject}`}
        subtitle={`${meta.code} · ${meta.section} · Max ${meta.max} marks`}
        action={<div className="flex gap-2">
          <Badge variant="outline">{published ? "Published" : locked ? "Locked" : "Draft"}</Badge>
        </div>}
      />
      <Tabs defaultValue="marks">
        <TabsList><TabsTrigger value="marks">Marks Entry</TabsTrigger><TabsTrigger value="schedule">Schedule</TabsTrigger><TabsTrigger value="hall">Hall Tickets</TabsTrigger></TabsList>
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
        <TabsContent value="schedule"><Card className="p-6 text-sm text-muted-foreground">Exam scheduled. Hall tickets auto-generated for eligible students.</Card></TabsContent>
        <TabsContent value="hall">
          <Card className="p-6 text-sm">
            <p className="text-muted-foreground mb-3">{students.length} hall tickets generated · 0 blocked.</p>
            <Button variant="outline" size="sm"><FileText className="h-3 w-3 mr-1" />Download all (ZIP)</Button>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={confirmLock} onOpenChange={setConfirmLock}>
        <DialogContent>
          <DialogHeader><DialogTitle>Lock marks?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Once locked, marks cannot be edited without HOI approval. This affects {students.length} students.</p>
          <DialogFooter><Button variant="outline" onClick={() => setConfirmLock(false)}>Cancel</Button><Button onClick={doLock}>Confirm lock</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmPublish} onOpenChange={setConfirmPublish}>
        <DialogContent>
          <DialogHeader><DialogTitle>Publish results?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{students.length} students and their parents will be notified. Grade cards will be generated.</p>
          <DialogFooter><Button variant="outline" onClick={() => setConfirmPublish(false)}>Cancel</Button><Button onClick={doPublish}>Publish now</Button></DialogFooter>
        </DialogContent>
      </Dialog>

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
              <div className="mx-auto h-14 w-14 rounded-full bg-lnx-green-500/15 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-lnx-green-500" />
              </div>
              <p className="text-sm font-medium">Push complete</p>
              <p className="text-xs text-muted-foreground">{students.length} grade cards now available in students' DigiLocker.</p>
              <Button onClick={() => setNadOpen(false)}>Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
