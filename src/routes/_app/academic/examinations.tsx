import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Calendar, FileText, ClipboardCheck, ChevronRight } from "lucide-react";
import { KpiCard } from "@/components/common/KpiCard";

export const Route = createFileRoute("/_app/academic/examinations")({
  head: () => ({ meta: [{ title: "Examinations — LearnNowX" }] }),
  component: ExamsPage,
});

const EXAMS = [
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
  return (
    <div>
      <PageHeader title="Examinations" subtitle="Schedule, conduct and finalise internal & external assessments" action={<Button><Plus className="h-4 w-4 mr-2" />Schedule Exam</Button>} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Scheduled" value={EXAMS.filter(e=>e.status==="scheduled").length} icon={Calendar} tone="teal" />
        <KpiCard label="Marks Pending" value={EXAMS.filter(e=>e.status==="marks-pending").length} icon={ClipboardCheck} tone="amber" />
        <KpiCard label="Completed" value={EXAMS.filter(e=>e.status==="completed").length} icon={FileText} tone="green" />
        <KpiCard label="Drafts" value={EXAMS.filter(e=>e.status==="draft").length} icon={FileText} />
      </div>
      <Card className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Exam</TableHead><TableHead>Subject</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead>Duration</TableHead><TableHead>Max Marks</TableHead><TableHead>Sections</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {EXAMS.map(e => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell><span className="font-mono text-xs text-muted-foreground">{e.subjectCode}</span> · {e.subject}</TableCell>
                <TableCell><Badge variant="outline">{e.type}</Badge></TableCell>
                <TableCell>{e.date}</TableCell>
                <TableCell>{e.duration} min</TableCell>
                <TableCell>{e.maxMarks}</TableCell>
                <TableCell>{e.sections.join(", ")}</TableCell>
                <TableCell><Badge variant="secondary" className={statusStyle[e.status]}>{e.status.replace("-"," ")}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
