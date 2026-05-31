import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/common/KpiCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFinanceStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { RazorpayMock } from "@/components/finance/RazorpayMock";
import { payFeeCascade } from "@/lib/cascade";
import { Wallet, Receipt, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/my/fees")({
  head: () => ({ meta: [{ title: "My Fees — LearnNowX" }] }),
  component: MyFeesPage,
});

function MyFeesPage() {
  const { user } = useAccess();
  const ledger = useFinanceStore(s => s.ledger);
  const [open, setOpen] = useState(false);
  if (!user) return null;

  // Look at child if parent
  const studentId = user.role === "parent" ? (user.childId ?? "") : user.id;
  const entries = ledger.filter(l => l.studentId === studentId);
  const totalPaid = entries.reduce((s, e) => s + (e.payment ?? 0), 0);
  const balance = entries[0]?.balance ?? 60000;
  const totalAnnual = 120000;
  const dueAmount = balance;

  const handleSuccess = (mode: string, txnId: string) => {
    payFeeCascade(studentId, dueAmount, mode, user.id);
    toast.success(`Payment of ₹${dueAmount.toLocaleString("en-IN")} successful`, { description: `Txn ${txnId}` });
  };

  return (
    <div>
      <PageHeader title="My Fees" subtitle={user.role === "parent" ? "On behalf of your child" : "Tuition fee & installments"} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Annual Fee" value={`₹${(totalAnnual/1000).toFixed(0)}K`} icon={Wallet} />
        <KpiCard label="Paid YTD" value={`₹${(totalPaid/1000).toFixed(0)}K`} icon={CheckCircle2} tone="green" />
        <KpiCard label="Outstanding" value={`₹${(balance/1000).toFixed(0)}K`} icon={AlertCircle} tone={balance > 0 ? "amber" : "green"} />
        <KpiCard label="Next Due" value={balance > 0 ? "31 Aug" : "—"} icon={Receipt} />
      </div>

      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-lnx-navy-800">Sem 5 · Installment 2</h3>
            <p className="text-xs text-muted-foreground">Tuition + Lab + Library + Exam · Due 31 Aug 2026</p>
          </div>
          {balance > 0 ? (
            <Button onClick={() => setOpen(true)} className="gap-2"><Wallet className="h-4 w-4" />Pay ₹{balance.toLocaleString("en-IN")} now</Button>
          ) : (
            <Badge className="bg-lnx-green-500/15 text-lnx-green-500">Paid in full</Badge>
          )}
        </div>
      </Card>

      <h3 className="text-sm font-semibold mb-3">Transaction history</h3>
      <Card className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Head</TableHead><TableHead>Charge</TableHead><TableHead>Payment</TableHead><TableHead>Balance</TableHead><TableHead>Note</TableHead></TableRow></TableHeader>
          <TableBody>
            {entries.length === 0 && (<TableRow><TableCell colSpan={6} className="py-8 text-center text-xs text-muted-foreground">No transactions yet.</TableCell></TableRow>)}
            {entries.map(e => (
              <TableRow key={e.id}>
                <TableCell className="text-xs">{e.date}</TableCell>
                <TableCell className="text-xs">{e.head}</TableCell>
                <TableCell>{e.charge ? `₹${e.charge.toLocaleString("en-IN")}` : "—"}</TableCell>
                <TableCell className="text-lnx-green-500 font-medium">{e.payment ? `₹${e.payment.toLocaleString("en-IN")}` : "—"}</TableCell>
                <TableCell className="font-mono text-xs">₹{e.balance.toLocaleString("en-IN")}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{e.reason ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <RazorpayMock
        open={open}
        onOpenChange={setOpen}
        amount={dueAmount}
        orderId={`LNX_${studentId.slice(-6).toUpperCase()}_${Date.now().toString(36).toUpperCase()}`}
        description="Tuition Sem 5 — Installment 2"
        onSuccess={handleSuccess}
      />
    </div>
  );
}
