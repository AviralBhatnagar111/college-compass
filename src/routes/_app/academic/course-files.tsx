import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { KpiCard } from "@/components/common/KpiCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, FolderOpen, Upload, AlertCircle } from "lucide-react";
import { useAcademicStore, useUsersStore, useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";

export const Route = createFileRoute("/_app/academic/course-files")({
  head: () => ({ meta: [{ title: "Course Files — LearnNowX" }] }),
  component: CourseFilesPage,
});

interface CourseFile {
  subjectId: string;
  facultyId: string;
  lecturePlan: boolean;
  syllabus: boolean;
  coverage: boolean;
  assignments: boolean;
  prevPapers: boolean;
  feedback: boolean;
}

function CourseFilesPage() {
  const { user } = useAccess();
  const subjects = useAcademicStore(s => s.subjects);
  const users = useUsersStore(s => s.users);
  const addAudit = useAccessStore(s => s.addAudit);
  const audit = (a: string, r?: string) => addAudit({ id: `a_${Date.now()}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hoi", module: "Course Files", action: a, reason: r });

  const faculty = users.filter(u => u.role === "faculty");
  const [files, setFiles] = useState<CourseFile[]>(() => subjects.map((s, i) => {
    const fac = faculty.find(f => f.department === s.departmentId) ?? faculty[i % faculty.length];
    const seed = i;
    return {
      subjectId: s.id, facultyId: fac?.id ?? "u_fac_anjali",
      lecturePlan: true, syllabus: true,
      coverage: seed % 3 !== 0, assignments: seed % 4 !== 0,
      prevPapers: seed % 5 !== 0, feedback: seed % 2 === 0,
    };
  }));

  const pct = (f: CourseFile) => {
    const items = [f.lecturePlan, f.syllabus, f.coverage, f.assignments, f.prevPapers, f.feedback];
    return Math.round((items.filter(Boolean).length / items.length) * 100);
  };

  const upload = (subjectId: string, key: keyof CourseFile) => {
    setFiles(fs => fs.map(f => f.subjectId === subjectId ? { ...f, [key]: true } as CourseFile : f));
    const sub = subjects.find(s => s.id === subjectId);
    audit(`Marked complete: ${String(key)}`, sub?.name);
    toast.success("Marked complete");
  };

  const avg = Math.round(files.reduce((a, f) => a + pct(f), 0) / files.length);
  const complete = files.filter(f => pct(f) === 100).length;
  const incomplete = files.filter(f => pct(f) < 100).length;

  // Faculty-wise compliance
  const facCompliance = faculty.map(f => {
    const myFiles = files.filter(x => x.facultyId === f.id);
    const myPct = myFiles.length ? Math.round(myFiles.reduce((a, x) => a + pct(x), 0) / myFiles.length) : 0;
    return { f, count: myFiles.length, pct: myPct };
  }).filter(x => x.count > 0).sort((a, b) => a.pct - b.pct);

  return (
    <div>
      <PageHeader title="Course File Compliance" subtitle="Director inspection view — Lecture Plan · Syllabus · Coverage · Assignments · Papers · Feedback" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Avg Compliance" value={`${avg}%`} icon={FolderOpen} tone="teal" />
        <KpiCard label="Fully Complete" value={complete} icon={Check} tone="green" />
        <KpiCard label="Incomplete" value={incomplete} icon={AlertCircle} tone="amber" />
        <KpiCard label="Total Course Files" value={files.length} icon={FolderOpen} />
      </div>

      <Card className="p-0 mb-6">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Subject</TableHead><TableHead>Faculty</TableHead>
            <TableHead className="text-center">Plan</TableHead><TableHead className="text-center">Syllabus</TableHead>
            <TableHead className="text-center">Coverage</TableHead><TableHead className="text-center">Assignments</TableHead>
            <TableHead className="text-center">Q-Papers</TableHead><TableHead className="text-center">Feedback</TableHead>
            <TableHead>Compliance</TableHead>
          </TableRow></TableHeader>
          <TableBody>{files.map(f => {
            const sub = subjects.find(s => s.id === f.subjectId);
            const fac = users.find(u => u.id === f.facultyId);
            const p = pct(f);
            const Cell = ({ ok, k }: { ok: boolean; k: keyof CourseFile }) => ok
              ? <Check className="h-4 w-4 text-lnx-green-500 mx-auto" />
              : <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-lnx-red-500" onClick={()=>upload(f.subjectId, k)}><Upload className="h-3 w-3 mr-1" />Upload</Button>;
            return (<TableRow key={f.subjectId}>
              <TableCell><div className="font-medium text-sm">{sub?.code}</div><div className="text-xs text-muted-foreground">{sub?.name}</div></TableCell>
              <TableCell className="text-sm">{fac?.firstName} {fac?.lastName}</TableCell>
              <TableCell className="text-center"><Cell ok={f.lecturePlan} k="lecturePlan" /></TableCell>
              <TableCell className="text-center"><Cell ok={f.syllabus} k="syllabus" /></TableCell>
              <TableCell className="text-center"><Cell ok={f.coverage} k="coverage" /></TableCell>
              <TableCell className="text-center"><Cell ok={f.assignments} k="assignments" /></TableCell>
              <TableCell className="text-center"><Cell ok={f.prevPapers} k="prevPapers" /></TableCell>
              <TableCell className="text-center"><Cell ok={f.feedback} k="feedback" /></TableCell>
              <TableCell className="w-32"><div className="flex items-center gap-2"><Progress value={p} className="h-2 flex-1" /><span className="text-xs tabular w-9">{p}%</span></div></TableCell>
            </TableRow>);
          })}</TableBody>
        </Table>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold text-lnx-navy-800 mb-3">Faculty-wise Compliance (lowest first)</h3>
        <div className="space-y-2">{facCompliance.slice(0, 8).map(fc => (
          <div key={fc.f.id} className="flex items-center gap-3"><span className="text-sm w-48">{fc.f.firstName} {fc.f.lastName}</span>
            <Progress value={fc.pct} className="h-2 flex-1" /><Badge variant={fc.pct<70?"destructive":fc.pct<90?"outline":"secondary"} className={fc.pct>=90?"bg-lnx-green-500/10 text-lnx-green-500":""}>{fc.pct}%</Badge>
          </div>
        ))}</div>
      </Card>
    </div>
  );
}
