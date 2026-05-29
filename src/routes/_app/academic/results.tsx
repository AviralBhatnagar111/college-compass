import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUsersStore } from "@/stores";
import { KpiCard } from "@/components/common/KpiCard";
import { Award, TrendingUp, AlertCircle, FileBarChart, Download, Lock } from "lucide-react";

export const Route = createFileRoute("/_app/academic/results")({
  head: () => ({ meta: [{ title: "Results — LearnNowX" }] }),
  component: ResultsPage,
});

function ResultsPage() {
  const users = useUsersStore(s => s.users);
  const students = users.filter(u => u.role === "student").slice(0, 20);

  const avgCgpa = students.reduce((s, x) => s + (x.cgpa ?? 0), 0) / students.length;
  const backlogs = students.filter(s => (s.backlogs ?? 0) > 0).length;
  const top = students.filter(s => (s.cgpa ?? 0) >= 8.5).length;

  return (
    <div>
      <PageHeader title="Results" subtitle="Internal grades, semester results, and CGPA tracking"
        action={<div className="flex gap-2"><Button variant="outline"><Lock className="h-4 w-4 mr-2" />Lock Marks</Button><Button><Download className="h-4 w-4 mr-2" />Publish</Button></div>} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Avg CGPA" value={avgCgpa.toFixed(2)} icon={Award} tone="teal" />
        <KpiCard label="Top performers (8.5+)" value={top} icon={TrendingUp} tone="green" />
        <KpiCard label="Students w/ backlogs" value={backlogs} icon={AlertCircle} tone="amber" />
        <KpiCard label="Results published" value="4 / 5" icon={FileBarChart} />
      </div>
      <Card className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Roll No</TableHead><TableHead>Student</TableHead><TableHead>Section</TableHead><TableHead>CGPA</TableHead><TableHead>Attendance</TableHead><TableHead>Backlogs</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {students.map(s => {
              const cgpa = s.cgpa ?? 0;
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.rollNo}</TableCell>
                  <TableCell className="font-medium">{s.firstName} {s.lastName}</TableCell>
                  <TableCell>{s.sectionId}</TableCell>
                  <TableCell><Badge variant="secondary" className={cgpa >= 8.5 ? "bg-lnx-green-500/10 text-lnx-green-500" : cgpa >= 7 ? "bg-lnx-teal-500/10 text-lnx-teal-500" : "bg-lnx-amber-500/10 text-lnx-amber-500"}>{cgpa.toFixed(2)}</Badge></TableCell>
                  <TableCell>{s.attendancePct ?? 0}%</TableCell>
                  <TableCell>{s.backlogs ?? 0}</TableCell>
                  <TableCell><Badge variant={(s.backlogs ?? 0) > 0 ? "destructive" : "secondary"}>{(s.backlogs ?? 0) > 0 ? "Has backlogs" : "Clear"}</Badge></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
