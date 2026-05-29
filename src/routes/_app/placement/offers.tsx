import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePlacementStore, useUsersStore } from "@/stores";
import { KpiCard } from "@/components/common/KpiCard";
import { BadgeCheck, Clock, XCircle, IndianRupee, Plus } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";

export const Route = createFileRoute("/_app/placement/offers")({
  head: () => ({ meta: [{ title: "Offers — LearnNowX" }] }),
  component: OffersPage,
});

const statusStyle: Record<string,string> = {
  accepted: "bg-lnx-green-500/10 text-lnx-green-500",
  pending: "bg-lnx-amber-500/10 text-lnx-amber-500",
  declined: "bg-lnx-red-500/10 text-lnx-red-500",
};

function OffersPage() {
  const offers = usePlacementStore(s => s.offers);
  const companies = usePlacementStore(s => s.companies);
  const users = useUsersStore(s => s.users);

  return (
    <div>
      <PageHeader title="Offers" subtitle="All offers issued this placement season" action={<Button><Plus className="h-4 w-4 mr-2" />Record Offer</Button>} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total" value={offers.length} icon={BadgeCheck} tone="teal" />
        <KpiCard label="Accepted" value={offers.filter(o=>o.status==="accepted").length} icon={BadgeCheck} tone="green" />
        <KpiCard label="Pending" value={offers.filter(o=>o.status==="pending").length} icon={Clock} tone="amber" />
        <KpiCard label="Highest" value={offers.reduce((m,o)=>{const n=parseFloat(o.package.replace(/[^\d.]/g,""));return n>m?n:m;},0).toFixed(1)+" LPA"} icon={IndianRupee} />
      </div>
      <Card className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Company</TableHead><TableHead>Package</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {offers.map(o => {
              const s = users.find(u => u.id === o.studentId);
              const c = companies.find(c => c.id === o.companyId);
              return (
                <TableRow key={o.id}>
                  <TableCell><div className="flex items-center gap-2">{s && <Avatar firstName={s.firstName} lastName={s.lastName} color={s.avatarColor} size="sm" />}<div><p className="font-medium text-sm">{s?.firstName} {s?.lastName}</p><p className="text-xs text-muted-foreground">{s?.rollNo}</p></div></div></TableCell>
                  <TableCell>{c?.name}</TableCell>
                  <TableCell><Badge variant="secondary">{o.package}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(o.date).toLocaleDateString()}</TableCell>
                  <TableCell><Badge variant="secondary" className={statusStyle[o.status]}>{o.status}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="sm">View</Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
