import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAcademicStore } from "@/stores";
import { Plus, BookOpen, Users, GraduationCap } from "lucide-react";
import { KpiCard } from "@/components/common/KpiCard";

export const Route = createFileRoute("/_app/academic/programs")({
  head: () => ({ meta: [{ title: "Programs — LearnNowX" }] }),
  component: ProgramsPage,
});

function ProgramsPage() {
  const programs = useAcademicStore(s => s.programs);
  const departments = useAcademicStore(s => s.departments);
  const sections = useAcademicStore(s => s.sections);
  const subjects = useAcademicStore(s => s.subjects);

  return (
    <div>
      <PageHeader
        title="Programs"
        subtitle="Academic programs across all departments"
        action={<Button><Plus className="h-4 w-4 mr-2" />New Program</Button>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Programs" value={programs.length} icon={GraduationCap} />
        <KpiCard label="Departments" value={departments.length} icon={BookOpen} tone="teal" />
        <KpiCard label="Active Sections" value={sections.length} icon={Users} />
        <KpiCard label="Subjects" value={subjects.length} icon={BookOpen} tone="amber" />
      </div>
      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Program</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Sections</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map(p => {
              const dept = departments.find(d => d.id === p.departmentId);
              const secs = sections.filter(s => s.programId === p.id);
              const subs = subjects.filter(s => s.departmentId === p.departmentId);
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{dept?.name ?? "—"}</TableCell>
                  <TableCell>{p.durationYears} years</TableCell>
                  <TableCell>{secs.length}</TableCell>
                  <TableCell>{subs.length}</TableCell>
                  <TableCell><Badge variant="secondary">Active</Badge></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
