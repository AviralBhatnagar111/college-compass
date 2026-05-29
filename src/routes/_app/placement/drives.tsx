import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePlacementStore } from "@/stores";
import { Plus, ArrowRight } from "lucide-react";
import { KpiCard } from "@/components/common/KpiCard";
import { Briefcase, Clock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_app/placement/drives")({
  head: () => ({ meta: [{ title: "Drives — LearnNowX" }] }),
  component: DrivesPage,
});

const statusStyle: Record<string,string> = {
  active: "bg-lnx-teal-500/10 text-lnx-teal-500",
  upcoming: "bg-lnx-amber-500/10 text-lnx-amber-500",
  completed: "bg-lnx-green-500/10 text-lnx-green-500",
};

function DrivesPage() {
  const drives = usePlacementStore(s => s.drives);
  const companies = usePlacementStore(s => s.companies);

  return (
    <div>
      <PageHeader title="Drives" subtitle="Active, upcoming and completed placement drives" action={<Button><Plus className="h-4 w-4 mr-2" />New Drive</Button>} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Active" value={drives.filter(d=>d.status==="active").length} icon={Briefcase} tone="teal" />
        <KpiCard label="Upcoming" value={drives.filter(d=>d.status==="upcoming").length} icon={Clock} tone="amber" />
        <KpiCard label="Completed" value={drives.filter(d=>d.status==="completed").length} icon={CheckCircle2} tone="green" />
        <KpiCard label="Total Applicants" value={drives.reduce((s,d)=>s+d.appliedIds.length,0)} icon={Briefcase} />
      </div>
      <Card className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Company</TableHead><TableHead>Role</TableHead><TableHead>Package</TableHead><TableHead>CGPA</TableHead><TableHead>Applied</TableHead><TableHead>Shortlisted</TableHead><TableHead>Selected</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {drives.map(d => {
              const c = companies.find(x => x.id === d.companyId);
              return (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{c?.name}</TableCell>
                  <TableCell>{d.role}</TableCell>
                  <TableCell><Badge variant="secondary">{d.package}</Badge></TableCell>
                  <TableCell>≥ {d.cgpaCutoff}</TableCell>
                  <TableCell>{d.appliedIds.length}</TableCell>
                  <TableCell>{d.shortlistedIds.length}</TableCell>
                  <TableCell>{d.selectedIds.length}</TableCell>
                  <TableCell><Badge variant="secondary" className={statusStyle[d.status]}>{d.status}</Badge></TableCell>
                  <TableCell><Button asChild variant="ghost" size="sm"><Link to="/placement/drives/$id" params={{ id: d.id }}>Open <ArrowRight className="h-3 w-3 ml-1" /></Link></Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
