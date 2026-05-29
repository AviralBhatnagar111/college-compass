import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAcademicStore } from "@/stores";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/academic/subjects")({
  head: () => ({ meta: [{ title: "Subjects — LearnNowX" }] }),
  component: SubjectsPage,
});

function SubjectsPage() {
  const subjects = useAcademicStore(s => s.subjects);
  const departments = useAcademicStore(s => s.departments);
  const [q, setQ] = useState("");

  const filtered = subjects.filter(s =>
    s.name.toLowerCase().includes(q.toLowerCase()) || s.code.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Subjects"
        subtitle={`${subjects.length} subjects across ${departments.length} departments`}
        action={<Button><Plus className="h-4 w-4 mr-2" />New Subject</Button>}
        filters={
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by code or name..." className="pl-9" />
          </div>
        }
      />
      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>L-T-P</TableHead>
              <TableHead>Semester</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs">{s.code}</TableCell>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{departments.find(d => d.id === s.departmentId)?.name ?? s.departmentId}</TableCell>
                <TableCell><Badge variant="secondary">{s.credits}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{s.ltp}</TableCell>
                <TableCell>Sem {s.semester}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
