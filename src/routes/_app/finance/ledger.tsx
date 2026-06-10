import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinanceStore, useUsersStore } from "@/stores";
import { KpiCard } from "@/components/common/KpiCard";
import { IndianRupee, Plus, Download, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { payFeeCascade } from "@/lib/cascade";
import { useAccess } from "@/lib/access";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/finance/ledger")({
  head: () => ({ meta: [{ title: "Ledger — LearnNowX" }] }),
  component: LedgerPage,
});

const INR = (n: number) => "₹" + n.toLocaleString("en-IN");

function LedgerPage() {
  const ledger = useFinanceStore(s => s.ledger);
  const users = useUsersStore(s => s.users);
  const { user } = useAccess();
  const [detail, setDetail] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({ studentId: "", amount: 60000, mode: "Razorpay" });

  const totals = useMemo(() => {
    const tCol = ledger.reduce((s, e) => s + (e.payment ?? 0), 0);
    const tCh = ledger.reduce((s, e) => s + (e.charge ?? 0), 0);
    const tSc = ledger.reduce((s, e) => s + (e.scholarship ?? 0), 0);
    return { tCol, tCh, tSc, out: tCh - tCol - tSc };
  }, [ledger]);

  // Top of ledger view: first 60 rows, but make student column clickable to drawer
  const display = ledger.slice(0, 80);
  const detailStudent = detail ? users.find(u => u.id === detail) : null;
  const detailRows = detail ? ledger.filter(l => l.studentId === detail) : [];
  const detailBalance = detailRows.reduce((s, e) => s + (e.charge ?? 0) - (e.payment ?? 0) - (e.scholarship ?? 0), 0);

  const handleExport = () => {
    const csv = ["Date,Student,Head,Charge,Payment,Scholarship,Balance"];
    ledger.forEach(e => {
      const s = users.find(u => u.id === e.studentId);
      csv.push(`${e.date},"${s?.firstName} ${s?.lastName}",${e.head},${e.charge ?? 0},${e.payment ?? 0},${e.scholarship ?? 0},${e.balance}`);
    });
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `ledger-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    toast.success("Ledger exported", { description: `${ledger.length} entries` });
  };

  const handleRecord = () => {
    if (!payForm.studentId || !payForm.amount) { toast.error("Select student & amount"); return; }
    payFeeCascade(payForm.studentId, payForm.amount, payForm.mode, user?.id ?? "u_finance_head");
    toast.success("Payment recorded", { description: `${INR(payForm.amount)} via ${payForm.mode} · receipt generated` });
    setPayOpen(false);
  };

  return (
    <div>
      <PageHeader title="Ledger & Payments" subtitle={`${ledger.length} entries · reconciled with Defaulters`}
        action={<div className="flex gap-2"><Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Export</Button><Button onClick={() => setPayOpen(true)}><Plus className="h-4 w-4 mr-2" />Record Payment</Button></div>} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Collected" value={INR(totals.tCol)} icon={ArrowDownRight} tone="green" />
        <KpiCard label="Charged" value={INR(totals.tCh)} icon={ArrowUpRight} tone="teal" />
        <KpiCard label="Scholarships" value={INR(totals.tSc)} icon={IndianRupee} tone="amber" />
        <KpiCard label="Outstanding" value={INR(totals.out)} icon={IndianRupee} tone="red" />
      </div>
      <Card className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Student</TableHead><TableHead>Head</TableHead><TableHead className="text-right">Charge</TableHead><TableHead className="text-right">Payment</TableHead><TableHead className="text-right">Scholarship</TableHead><TableHead className="text-right">Balance</TableHead></TableRow></TableHeader>
          <TableBody>
            {display.map(e => {
              const s = users.find(u => u.id === e.studentId);
              return (
                <TableRow key={e.id} className="cursor-pointer hover:bg-accent/40" onClick={() => setDetail(e.studentId)}>
                  <TableCell className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</TableCell>
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

      <Sheet open={!!detail} onOpenChange={v => !v && setDetail(null)}>
        <SheetContent className="w-[560px] sm:max-w-[560px]">
          <SheetHeader><SheetTitle>{detailStudent?.firstName} {detailStudent?.lastName} · Ledger</SheetTitle></SheetHeader>
          {detailStudent && (
            <div className="mt-4 space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded border p-3"><p className="text-xs text-muted-foreground">Roll No</p><p className="font-mono">{detailStudent.rollNo}</p></div>
                <div className="rounded border p-3"><p className="text-xs text-muted-foreground">Section</p><p className="font-medium">{detailStudent.sectionId}</p></div>
                <div className="rounded border p-3"><p className="text-xs text-muted-foreground">Balance</p><p className="font-bold tabular text-lnx-red-500">{INR(detailBalance)}</p></div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Transactions</p>
                <div className="space-y-1">{detailRows.map(e => (
                  <div key={e.id} className="grid grid-cols-[1fr,80px,80px,80px] gap-2 rounded border p-2 text-xs">
                    <div><div className="font-medium">{e.head}</div><div className="text-muted-foreground">{new Date(e.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div></div>
                    <div className="text-right">{e.charge ? INR(e.charge) : "—"}</div>
                    <div className="text-right text-lnx-green-500">{e.payment ? INR(e.payment) : "—"}</div>
                    <div className="text-right text-lnx-amber-500">{e.scholarship ? INR(e.scholarship) : "—"}</div>
                  </div>
                ))}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { setPayForm({ ...payForm, studentId: detailStudent.id, amount: Math.max(detailBalance, 0) || 60000 }); setPayOpen(true); setDetail(null); }}>Record Payment</Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => toast.success("Waiver request submitted", { description: "Awaiting HOI approval" })}>Apply Waiver</Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => toast.success("Refund initiated", { description: "Finance team will process" })}>Refund</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Student</Label><Select value={payForm.studentId} onValueChange={v => setPayForm({...payForm, studentId: v})}><SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger><SelectContent>{users.filter(u => u.role === "student").slice(0, 50).map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} · {s.rollNo}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-2"><div><Label>Amount (₹)</Label><Input type="number" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: +e.target.value})} /></div><div><Label>Mode</Label><Select value={payForm.mode} onValueChange={v => setPayForm({...payForm, mode: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Razorpay">Razorpay</SelectItem><SelectItem value="UPI">UPI</SelectItem><SelectItem value="DD">Demand Draft</SelectItem><SelectItem value="Cash">Cash</SelectItem></SelectContent></Select></div></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setPayOpen(false)}>Cancel</Button><Button onClick={handleRecord}>Record & Generate Receipt</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
