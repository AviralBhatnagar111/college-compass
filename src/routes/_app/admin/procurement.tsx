import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { Package, IndianRupee, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/procurement")({
  head: () => ({ meta: [{ title: "Procurement & Assets — LearnNowX" }] }),
  component: ProcurementPage,
});

interface Asset { id: string; tag: string; name: string; category: string; location: string; value: number; amc: string; status: "active" | "maintenance" | "retired"; }
interface PR { id: string; item: string; qty: number; amount: number; requestor: string; status: "pending" | "approved" | "rejected"; date: string; }

const ASSETS: Asset[] = [
  { id: "AST1", tag: "BIEM-LAB-CSE-001", name: "Lenovo ThinkCentre Desktop (40 units)", category: "IT Equipment", location: "CSE Lab 1", value: 1800000, amc: "Lenovo, exp 2027-03", status: "active" },
  { id: "AST2", tag: "BIEM-LAB-ECE-002", name: "Tektronix Oscilloscopes (12 units)", category: "Lab Equipment", location: "ECE Lab", value: 960000, amc: "Tektronix, exp 2026-12", status: "active" },
  { id: "AST3", tag: "BIEM-PROJ-101", name: "Epson EB-X51 Projectors (8 units)", category: "AV", location: "LH-101 to LH-108", value: 320000, amc: "Epson, exp 2026-09", status: "active" },
  { id: "AST4", tag: "BIEM-GEN-001", name: "Diesel Generator 125 KVA", category: "Infrastructure", location: "Main Block", value: 850000, amc: "Kirloskar, exp 2027-06", status: "maintenance" },
];

const PRS: PR[] = [
  { id: "PR1", item: "Additional 20 desktops for new lab", qty: 20, amount: 900000, requestor: "HOD CSE", status: "pending", date: "2026-06-25" },
  { id: "PR2", item: "Library books – CSE Vol III", qty: 50, amount: 75000, requestor: "Librarian", status: "pending", date: "2026-06-27" },
  { id: "PR3", item: "Lab chemicals – BIOTECH", qty: 1, amount: 145000, requestor: "HOD BIOTECH", status: "approved", date: "2026-06-20" },
];

function ProcurementPage() {
  const [prs, setPrs] = useState(PRS);
  const [open, setOpen] = useState<Asset | null>(null);
  const addAudit = useAccessStore(s => s.addAudit);
  const { user } = useAccess();

  const totalValue = ASSETS.reduce((s, a) => s + a.value, 0);
  const pendingValue = prs.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);

  const decide = (id: string, decision: "approved" | "rejected") => {
    const pr = prs.find(p => p.id === id);
    if (!pr) return;
    setPrs(p => p.map(x => x.id === id ? { ...x, status: decision } : x));
    addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hoi", module: "Procurement", action: `PR ${decision}: ${pr.item} (₹${pr.amount.toLocaleString("en-IN")})` });
    toast.success(`Purchase request ${decision}`);
  };

  return (
    <div>
      <PageHeader title="Procurement & Assets" subtitle="Asset register, purchase requests, suppliers and maintenance" action={<Button><Plus className="h-4 w-4 mr-2" />New request</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Asset count</div><div className="mt-1 text-2xl font-semibold tabular">{ASSETS.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Asset value</div><div className="mt-1 text-2xl font-semibold tabular"><IndianRupee className="h-4 w-4 inline" />{(totalValue/100000).toFixed(1)}L</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Pending PRs</div><div className="mt-1 text-2xl font-semibold tabular text-lnx-amber-500">{prs.filter(p => p.status === "pending").length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Pending value</div><div className="mt-1 text-2xl font-semibold tabular"><IndianRupee className="h-4 w-4 inline" />{(pendingValue/100000).toFixed(1)}L</div></Card>
      </div>

      <Tabs defaultValue="assets">
        <TabsList><TabsTrigger value="assets">Asset register</TabsTrigger><TabsTrigger value="prs">Purchase requests</TabsTrigger></TabsList>
        <TabsContent value="assets" className="mt-4">
          <Card><Table>
            <TableHeader><TableRow><TableHead>Tag</TableHead><TableHead>Asset</TableHead><TableHead>Category</TableHead><TableHead>Location</TableHead><TableHead>Value</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{ASSETS.map(a => (
              <TableRow key={a.id} className="cursor-pointer" onClick={() => setOpen(a)}>
                <TableCell className="font-mono text-xs">{a.tag}</TableCell>
                <TableCell>{a.name}</TableCell>
                <TableCell><Badge variant="outline">{a.category}</Badge></TableCell>
                <TableCell className="text-xs">{a.location}</TableCell>
                <TableCell className="tabular"><IndianRupee className="h-3 w-3 inline" />{a.value.toLocaleString("en-IN")}</TableCell>
                <TableCell><Badge variant={a.status === "active" ? "outline" : "secondary"}>{a.status}</Badge></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table></Card>
        </TabsContent>
        <TabsContent value="prs" className="mt-4">
          <Card><Table>
            <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead>Amount</TableHead><TableHead>Requestor</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>{prs.map(p => (
              <TableRow key={p.id}>
                <TableCell>{p.item}</TableCell>
                <TableCell className="tabular">{p.qty}</TableCell>
                <TableCell className="tabular"><IndianRupee className="h-3 w-3 inline" />{p.amount.toLocaleString("en-IN")}</TableCell>
                <TableCell className="text-xs">{p.requestor}</TableCell>
                <TableCell><Badge variant={p.status === "pending" ? "secondary" : p.status === "approved" ? "outline" : "destructive"}>{p.status}</Badge></TableCell>
                <TableCell>{p.status === "pending" && <div className="flex gap-1"><Button size="sm" onClick={() => decide(p.id, "approved")}>Approve</Button><Button size="sm" variant="outline" onClick={() => decide(p.id, "rejected")}>Reject</Button></div>}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table></Card>
          <p className="text-xs text-muted-foreground mt-2">Approved PRs flow into <Link to="/finance/budget" className="text-lnx-teal-500">Budget vs Actual</Link>.</p>
        </TabsContent>
      </Tabs>

      <Sheet open={!!open} onOpenChange={v => !v && setOpen(null)}>
        <SheetContent>
          {open && (<>
            <SheetHeader><SheetTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-lnx-teal-500" />{open.name}</SheetTitle></SheetHeader>
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Tag:</span> <span className="font-mono">{open.tag}</span></p>
              <p><span className="text-muted-foreground">Category:</span> {open.category}</p>
              <p><span className="text-muted-foreground">Location:</span> {open.location}</p>
              <p><span className="text-muted-foreground">Value:</span> ₹{open.value.toLocaleString("en-IN")}</p>
              <p><span className="text-muted-foreground">AMC:</span> {open.amc}</p>
              <p><span className="text-muted-foreground">Status:</span> {open.status}</p>
            </div>
          </>)}
        </SheetContent>
      </Sheet>
    </div>
  );
}
