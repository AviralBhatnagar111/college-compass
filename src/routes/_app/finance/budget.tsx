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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinanceStore, useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { TrendingUp, TrendingDown, Wallet, Receipt, Plus, IndianRupee, Save } from "lucide-react";

export const Route = createFileRoute("/_app/finance/budget")({
  head: () => ({ meta: [{ title: "Budget vs Actual — LearnNowX" }] }),
  component: BudgetPage,
});

const INR = (n: number) => "₹" + n.toLocaleString("en-IN");
const lakh = (n: number) => `₹${(n/100000).toFixed(2)}L`;

interface BudgetLine { id: string; category: string; type: "income" | "expense"; budget: number; actual: number; owner: string; }

function BudgetPage() {
  const { user } = useAccess();
  const ledger = useFinanceStore(s => s.ledger);
  const addAudit = useAccessStore(s => s.addAudit);
  const audit = (a: string, r?: string) => addAudit({ id: `a_${Date.now()}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hoi", module: "Finance", action: a, reason: r });

  const feeCollected = ledger.reduce((s, e) => s + (e.payment ?? 0), 0);

  const [lines, setLines] = useState<BudgetLine[]>([
    // Income
    { id: "I1", category: "Tuition Fees", type: "income", budget: 16800000, actual: feeCollected, owner: "Finance" },
    { id: "I2", category: "Hostel & Mess", type: "income", budget: 3500000, actual: 2100000, owner: "Hostel Office" },
    { id: "I3", category: "Govt Grants (AICTE/State)", type: "income", budget: 1200000, actual: 1200000, owner: "Director" },
    { id: "I4", category: "Consultancy & Workshops", type: "income", budget: 800000, actual: 540000, owner: "TPO/HoDs" },
    // Expense — by department
    { id: "E1", category: "Salaries — Faculty", type: "expense", budget: 9600000, actual: 7980000, owner: "HR" },
    { id: "E2", category: "Salaries — Non-Teaching", type: "expense", budget: 2400000, actual: 1995000, owner: "HR" },
    { id: "E3", category: "Infrastructure & Maintenance", type: "expense", budget: 1800000, actual: 1450000, owner: "Estate" },
    { id: "E4", category: "Labs & Equipment", type: "expense", budget: 1400000, actual: 1180000, owner: "HoDs" },
    { id: "E5", category: "Library & Subscriptions", type: "expense", budget: 600000, actual: 520000, owner: "Library" },
    { id: "E6", category: "IT & Software", type: "expense", budget: 900000, actual: 760000, owner: "IT" },
    { id: "E7", category: "Marketing & Admissions", type: "expense", budget: 500000, actual: 380000, owner: "Admissions" },
    { id: "E8", category: "Scholarships Disbursed", type: "expense", budget: 800000, actual: 420000, owner: "Finance" },
    { id: "E9", category: "Compliance & Audits", type: "expense", budget: 300000, actual: 245000, owner: "IQAC" },
    { id: "E10", category: "Events & Outreach", type: "expense", budget: 400000, actual: 290000, owner: "Student Affairs" },
  ]);

  const income = lines.filter(l => l.type === "income");
  const expense = lines.filter(l => l.type === "expense");
  const totalIncomeBudget = income.reduce((s,l)=>s+l.budget,0);
  const totalIncomeActual = income.reduce((s,l)=>s+l.actual,0);
  const totalExpenseBudget = expense.reduce((s,l)=>s+l.budget,0);
  const totalExpenseActual = expense.reduce((s,l)=>s+l.actual,0);
  const surplus = totalIncomeActual - totalExpenseActual;
  const surplusBudget = totalIncomeBudget - totalExpenseBudget;

  // Concession/installment requests
  const [requests, setRequests] = useState([
    { id: "R1", student: "Ananya Reddy", roll: "23BCSE015", type: "Concession 20%", reason: "Single-parent income certificate", status: "pending" as "pending"|"approved"|"rejected" },
    { id: "R2", student: "Karan Mehta", roll: "23BECE008", type: "Installment reschedule", reason: "Medical emergency in family", status: "pending" as "pending"|"approved"|"rejected" },
    { id: "R3", student: "Diya Pandey", roll: "23BME011", type: "Concession 15%", reason: "Sibling concession", status: "pending" as "pending"|"approved"|"rejected" },
  ]);
  const decide = (id: string, decision: "approved" | "rejected") => {
    const r = requests.find(x=>x.id===id);
    setRequests(rs => rs.map(x => x.id === id ? { ...x, status: decision } : x));
    audit(`${decision === "approved" ? "Approved" : "Rejected"} ${r?.type}`, `${r?.student} (${r?.roll}) — ${r?.reason}`);
    toast.success(`Request ${decision}`);
  };

  // Add expense
  const [openNew, setOpenNew] = useState(false);
  const [nl, setNl] = useState<{ category: string; type: "income"|"expense"; budget: number; actual: number; owner: string }>({ category: "", type: "expense", budget: 0, actual: 0, owner: "" });
  const submit = () => {
    if (!nl.category) { toast.error("Category required"); return; }
    setLines([...lines, { id: `L_${Date.now()}`, ...nl }]);
    audit(`Added budget line: ${nl.category}`, `${nl.type} · Budget ${INR(nl.budget)}`);
    toast.success("Budget line added");
    setOpenNew(false); setNl({ category: "", type: "expense", budget: 0, actual: 0, owner: "" });
  };

  const [detail, setDetail] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ budget: number; actual: number } | null>(null);
  const openDetail = (l: BudgetLine) => { setDetail(l.id); setEdit({ budget: l.budget, actual: l.actual }); };
  const sel = lines.find(l => l.id === detail);
  const saveEdit = () => {
    if (!sel || !edit) return;
    const before = { budget: sel.budget, actual: sel.actual };
    setLines(ls => ls.map(x => x.id === sel.id ? { ...x, budget: edit.budget, actual: edit.actual } : x));
    audit(`Edited budget line: ${sel.category}`, `Budget ${lakh(before.budget)}→${lakh(edit.budget)}, Actual ${lakh(before.actual)}→${lakh(edit.actual)}`);
    toast.success("Line updated");
    setDetail(null);
  };

  const Row = ({ l }: { l: BudgetLine }) => {
    const pct = Math.round((l.actual/Math.max(1,l.budget))*100);
    const variance = l.actual - l.budget;
    return (<TableRow className="cursor-pointer hover:bg-accent/40" onClick={()=>openDetail(l)}>
      <TableCell><div className="font-medium text-sm">{l.category}</div><div className="text-xs text-muted-foreground">{l.owner}</div></TableCell>
      <TableCell className="text-right tabular">{lakh(l.budget)}</TableCell>
      <TableCell className="text-right tabular font-semibold">{lakh(l.actual)}</TableCell>
      <TableCell className="w-40"><div className="flex items-center gap-2"><Progress value={Math.min(100, pct)} className="h-2 flex-1" /><span className="text-xs tabular w-9">{pct}%</span></div></TableCell>
      <TableCell className="text-right tabular text-xs"><span className={variance>=0 && l.type==="income" || variance<0 && l.type==="expense" ? "text-lnx-green-500" : "text-lnx-red-500"}>{variance>=0?"+":""}{lakh(variance)}</span></TableCell>
    </TableRow>);
  };

  return (
    <div>
      <PageHeader title="Budget vs Actual" subtitle="Institution-wide income, expense, surplus tracking + concession requests"
        action={<Button onClick={()=>setOpenNew(true)}><Plus className="h-4 w-4 mr-2" />Add Line</Button>} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Income (Actual)" value={lakh(totalIncomeActual)} icon={TrendingUp} tone="green" />
        <KpiCard label="Expense (Actual)" value={lakh(totalExpenseActual)} icon={TrendingDown} tone="red" />
        <KpiCard label="Surplus" value={lakh(surplus)} icon={Wallet} tone={surplus>=0?"teal":"red"} />
        <KpiCard label="Surplus (Budget)" value={lakh(surplusBudget)} icon={IndianRupee} />
      </div>

      <Tabs defaultValue="budget">
        <TabsList><TabsTrigger value="budget">Budget vs Actual</TabsTrigger><TabsTrigger value="requests">Concession Requests</TabsTrigger></TabsList>

        <TabsContent value="budget" className="mt-4 space-y-6">
          <Card className="p-0">
            <div className="p-4 border-b flex items-center justify-between"><h3 className="font-semibold text-lnx-navy-800 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-lnx-green-500" />Income</h3><Badge variant="outline">{income.length} lines</Badge></div>
            <Table><TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Budget</TableHead><TableHead className="text-right">Actual</TableHead><TableHead>Utilization</TableHead><TableHead className="text-right">Variance</TableHead></TableRow></TableHeader>
              <TableBody>{income.map(l => <Row key={l.id} l={l} />)}</TableBody>
            </Table>
          </Card>
          <Card className="p-0">
            <div className="p-4 border-b flex items-center justify-between"><h3 className="font-semibold text-lnx-navy-800 flex items-center gap-2"><TrendingDown className="h-4 w-4 text-lnx-red-500" />Expense</h3><Badge variant="outline">{expense.length} lines</Badge></div>
            <Table><TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Budget</TableHead><TableHead className="text-right">Actual</TableHead><TableHead>Utilization</TableHead><TableHead className="text-right">Variance</TableHead></TableRow></TableHeader>
              <TableBody>{expense.map(l => <Row key={l.id} l={l} />)}</TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-4"><Card className="p-0">
          <Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Type</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>{requests.map(r => (<TableRow key={r.id}><TableCell><div className="font-medium text-sm">{r.student}</div><div className="text-xs text-muted-foreground">{r.roll}</div></TableCell><TableCell><Badge variant="outline">{r.type}</Badge></TableCell><TableCell className="text-sm">{r.reason}</TableCell><TableCell><Badge variant={r.status==="approved"?"secondary":r.status==="rejected"?"destructive":"outline"} className={r.status==="approved"?"bg-lnx-green-500/10 text-lnx-green-500":""}>{r.status}</Badge></TableCell><TableCell className="text-right">{r.status === "pending" && <div className="flex gap-1 justify-end"><Button size="sm" variant="outline" onClick={()=>decide(r.id,"rejected")}>Reject</Button><Button size="sm" onClick={()=>decide(r.id,"approved")}>Approve</Button></div>}</TableCell></TableRow>))}</TableBody>
          </Table></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent><DialogHeader><DialogTitle>Add Budget Line</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Category</Label><Input value={nl.category} onChange={e=>setNl({...nl, category:e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label><Select value={nl.type} onValueChange={(v: any)=>setNl({...nl, type:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="income">Income</SelectItem><SelectItem value="expense">Expense</SelectItem></SelectContent></Select></div>
              <div><Label>Owner</Label><Input value={nl.owner} onChange={e=>setNl({...nl, owner:e.target.value})} /></div>
              <div><Label>Budget (₹)</Label><Input type="number" value={nl.budget} onChange={e=>setNl({...nl, budget:+e.target.value})} /></div>
              <div><Label>Actual (₹)</Label><Input type="number" value={nl.actual} onChange={e=>setNl({...nl, actual:+e.target.value})} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setOpenNew(false)}>Cancel</Button><Button onClick={submit}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
