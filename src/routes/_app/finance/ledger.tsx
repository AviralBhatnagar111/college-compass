import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFinanceStore, useUsersStore } from "@/stores";
import { KpiCard } from "@/components/common/KpiCard";
import { IndianRupee, Plus, Download, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";

export const Route = createFileRoute("/_app/finance/ledger")({
  head: () => ({ meta: [{ title: "Ledger — LearnNowX" }] }),
  component: LedgerPage,
});

const INR = (n: number) => "₹" + n.toLocaleString("en-IN");

function LedgerPage() {
  const ledger = useFinanceStore(s => s.ledger);
  const users = useUsersStore(s => s.users);
  const totalCollected = ledger.reduce((s,e)=>s+(e.payment ?? 0), 0);
  const totalCharged = ledger.reduce((s,e)=>s+(e.charge ?? 0), 0);
  const totalScholarship = ledger.reduce((s,e)=>s+(e.scholarship ?? 0), 0);
  const outstanding = totalCharged - totalCollected - totalScholarship;

  return (
    <div>
      <PageHeader title="Ledger & Payments" subtitle="Charge ledger and reconciliation" action={<div className="flex gap-2"><Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button><Button><Plus className="h-4 w-4 mr-2" />Record Payment</Button></div>} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Collected" value={INR(totalCollected)} icon={ArrowDownRight} tone="green" />
        <KpiCard label="Charged" value={INR(totalCharged)} icon={ArrowUpRight} tone="teal" />
        <KpiCard label="Scholarships" value={INR(totalScholarship)} icon={IndianRupee} tone="amber" />
        <KpiCard label="Outstanding" value={INR(outstanding)} icon={IndianRupee} tone="red" />
      </div>
      <Card className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Student</TableHead><TableHead>Head</TableHead><TableHead className="text-right">Charge</TableHead><TableHead className="text-right">Payment</TableHead><TableHead className="text-right">Scholarship</TableHead><TableHead className="text-right">Balance</TableHead></TableRow></TableHeader>
          <TableBody>
            {ledger.map(e => {
              const s = users.find(u => u.id === e.studentId);
              return (
                <TableRow key={e.id}>
                  <TableCell className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString()}</TableCell>
                  <TableCell><div className="flex items-center gap-2">{s && <Avatar firstName={s.firstName} lastName={s.lastName} color={s.avatarColor} size="sm" />}<span className="font-medium text-sm">{s?.firstName} {s?.lastName}</span></div></TableCell>
                  <TableCell>{e.head}</TableCell>
                  <TableCell className="text-right tabular">{e.charge ? INR(e.charge) : "—"}</TableCell>
                  <TableCell className="text-right tabular text-lnx-green-500">{e.payment ? INR(e.payment) : "—"}</TableCell>
                  <TableCell className="text-right tabular text-lnx-amber-500">{e.scholarship ? INR(e.scholarship) : "—"}</TableCell>
                  <TableCell className="text-right tabular font-semibold"><Badge variant={e.balance===0?"secondary":"outline"} className={e.balance===0?"bg-lnx-green-500/10 text-lnx-green-500":""}>{INR(e.balance)}</Badge></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
