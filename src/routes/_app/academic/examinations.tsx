import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Calendar, FileText, ClipboardCheck, ChevronRight } from "lucide-react";
import { KpiCard } from "@/components/common/KpiCard";
import { useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/academic/examinations")({
  head: () => ({ meta: [{ title: "Examinations — LearnNowX" }] }),
  component: ExamsPage,
});

interface Exam { id: string; name: string; type: string; subject: string; subjectCode: string; date: string; duration: number; maxMarks: number; sections: string[]; status: "scheduled"|"draft"|"completed"|"marks-pending"; }

const SEED: Exam[] = [
  { id: "EX1", name: "Mid-Sem Internal-1", type: "Internal", subject: "Database Management Systems", subjectCode: "CS301", date: "2026-06-10", duration: 90, maxMarks: 30, sections: ["CSE-A1","CSE-A2"], status: "scheduled" },
  { id: "EX2", name: "Mid-Sem Internal-1", type: "Internal", subject: "Operating Systems", subjectCode: "CS302", date: "2026-06-12", duration: 90, maxMarks: 30, sections: ["CSE-A1","CSE-A2"], status: "scheduled" },
  { id: "EX3", name: "End-Semester", type: "External", subject: "AI & Machine Learning", subjectCode: "CS303", date: "2026-07-15", duration: 180, maxMarks: 100, sections: ["CSE-A1","CSE-A2"], status: "draft" },
  { id: "EX4", name: "Mid-Sem Internal-1", type: "Internal", subject: "VLSI Design", subjectCode: "EC301", date: "2026-06-08", duration: 90, maxMarks: 30, sections: ["ECE-B1"], status: "completed" },
  { id: "EX5", name: "Quiz-1", type: "Quiz", subject: "Computer Networks", subjectCode: "CS304", date: "2026-05-28", duration: 30, maxMarks: 10, sections: ["CSE-A1"], status: "marks-pending" },
];

const statusStyle: Record<string,string> = {
  "scheduled": "bg-lnx-teal-500/10 text-lnx-teal-500",
  "draft": "bg-muted text-muted-foreground",
  "completed": "bg-lnx-green-500/10 text-lnx-green-500",
  "marks-pending": "bg-lnx-amber-500/10 text-lnx-amber-500",
};

function ExamsPage() {
  const navigate = useNavigate();
  const { user: me } = useAccess();
  const addAudit = useAccessStore(s => s.addAudit);
  const [exams, setExams] = useState<Exam[]>(SEED);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "Mid-Sem Internal-2", type: "Internal", subject: "", subjectCode: "", date: "", duration: 90, maxMarks: 30, sections: "CSE-A1" });

  const create = () => {
    if (!form.subject || !form.date || !form.subjectCode) { toast.error("Subject, code and date required"); return; }
    const e: Exam = { id: `EX${Date.now().toString(36)}`, name: form.name, type: form.type, subject: form.subject, subjectCode: form.subjectCode, date: form.date, duration: Number(form.duration), maxMarks: Number(form.maxMarks), sections: form.sections.split(",").map(s=>s.trim()).filter(Boolean), status: "scheduled" };
    setExams(p => [e, ...p]);
    addAudit({ id: `a_${Date.now()}`, at: new Date().toISOString(), actorId: me?.id ?? "system", action: "exam.create", module: "academic", after: { code: e.subjectCode, date: e.date } });
    toast.success(`Exam scheduled for ${e.date}`, { description: `Hall tickets will be auto-generated for eligible students.` });
    setOpen(false);
  };

  return (
    <div>
      <PageHeader title="Examinations" subtitle="Schedule, conduct and finalise internal & external assessments" action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Schedule Exam</Button>} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Scheduled" value={exams.filter(e=>e.status==="scheduled").length} icon={Calendar} tone="teal" />
        <KpiCard label="Marks Pending" value={exams.filter(e=>e.status==="marks-pending").length} icon={ClipboardCheck} tone="amber" />
        <KpiCard label="Completed" value={exams.filter(e=>e.status==="completed").length} icon={FileText} tone="green" />
        <KpiCard label="Drafts" value={exams.filter(e=>e.status==="draft").length} icon={FileText} />
      </div>
      <Card className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Exam</TableHead><TableHead>Subject</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead>Duration</TableHead><TableHead>Max</TableHead><TableHead>Sections</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {exams.map(e => (
              <TableRow key={e.id} className="hover:bg-accent/40 cursor-pointer" onClick={() => navigate({ to: "/academic/examinations/$id", params: { id: e.id } })}>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell><span className="font-mono text-xs text-muted-foreground">{e.subjectCode}</span> · {e.subject}</TableCell>
                <TableCell><Badge variant="outline">{e.type}</Badge></TableCell>
                <TableCell>{e.date}</TableCell>
                <TableCell>{e.duration} min</TableCell>
                <TableCell>{e.maxMarks}</TableCell>
                <TableCell>{e.sections.join(", ")}</TableCell>
                <TableCell><Badge variant="secondary" className={statusStyle[e.status]}>{e.status.replace("-"," ")}</Badge></TableCell>
                <TableCell><Button asChild size="sm" variant="ghost" onClick={(ev) => ev.stopPropagation()}><Link to="/academic/examinations/$id" params={{ id: e.id }}>Open <ChevronRight className="h-3 w-3 ml-1" /></Link></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Schedule new exam</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2"><Label>Exam name</Label><Input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} /></div>
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={(v)=>setForm(p=>({...p,type:v}))}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Internal","External","Quiz","Practical","Viva"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Date</Label><Input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} /></div>
            <div><Label>Subject code</Label><Input value={form.subjectCode} onChange={e=>setForm(p=>({...p,subjectCode:e.target.value.toUpperCase()}))} placeholder="CS301" /></div>
            <div><Label>Subject name</Label><Input value={form.subject} onChange={e=>setForm(p=>({...p,subject:e.target.value}))} /></div>
            <div><Label>Duration (min)</Label><Input type="number" value={form.duration} onChange={e=>setForm(p=>({...p,duration:Number(e.target.value)}))} /></div>
            <div><Label>Max marks</Label><Input type="number" value={form.maxMarks} onChange={e=>setForm(p=>({...p,maxMarks:Number(e.target.value)}))} /></div>
            <div className="col-span-2"><Label>Sections (comma-separated)</Label><Input value={form.sections} onChange={e=>setForm(p=>({...p,sections:e.target.value}))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button><Button onClick={create}>Schedule exam</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
