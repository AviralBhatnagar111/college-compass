import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinanceStore, useAcademicStore, useUsersStore } from "@/stores";
import { Plus, IndianRupee, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/finance/fee-structures")({
  head: () => ({ meta: [{ title: "Fee Structures — LearnNowX" }] }),
  component: FeeStructuresPage,
});

const INR = (n: number) => "₹" + n.toLocaleString("en-IN");

function FeeStructuresPage() {
  const structures = useFinanceStore(s => s.structures);
  const addStructure = useFinanceStore(s => s.addStructure);
  const programs = useAcademicStore(s => s.programs);
  const users = useUsersStore(s => s.users);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [meta, setMeta] = useState({ name: "", batch: "2026-30", programId: "P_CSE", category: "General" });
  const [installments, setInstallments] = useState([{ label: "Installment 1", amount: 50000 }, { label: "Installment 2", amount: 50000 }]);
  const total = installments.reduce((s,i)=>s+(+i.amount||0),0);
  const sel = structures.find(s => s.id === detail);
  const selStudents = sel ? users.filter(u => u.role === "student" && u.programId === sel.programId) : [];

  const handleSave = () => {
    if (!meta.name) { toast.error("Name required"); return; }
    const id = `FS_${meta.programId}_${Date.now().toString(36)}`;
    const inst = installments.map((i, idx) => ({ ...i, dueDate: new Date(Date.now() + (idx * 180) * 86400000).toISOString() }));
    addStructure({ id, name: meta.name, programId: meta.programId, batch: meta.batch, total, installments: inst, assignedCount: 0 });
    toast.success("Structure saved", { description: `${meta.name} · ₹${total.toLocaleString("en-IN")}` });
    setOpen(false);
  };


  return (
    <div>
      <PageHeader title="Fee Structures" subtitle={`${structures.length} active structures`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Build Structure</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Fee Structure Builder</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Name</Label><Input value={meta.name} onChange={e => setMeta({...meta, name: e.target.value})} placeholder="B.Tech CSE 2026-30" /></div>
                  <div><Label>Batch</Label><Input value={meta.batch} onChange={e => setMeta({...meta, batch: e.target.value})} /></div>
                  <div><Label>Program</Label><Select value={meta.programId} onValueChange={v => setMeta({...meta, programId: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Category</Label><Select value={meta.category} onValueChange={v => setMeta({...meta, category: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="General">General</SelectItem><SelectItem value="SC/ST/OBC">SC / ST / OBC</SelectItem><SelectItem value="EWS">EWS</SelectItem><SelectItem value="NRI">NRI</SelectItem><SelectItem value="Management">Management</SelectItem></SelectContent></Select></div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2"><Label>Installments</Label><Button size="sm" variant="ghost" onClick={() => setInstallments([...installments, { label: `Installment ${installments.length+1}`, amount: 0 }])}><Plus className="h-3 w-3 mr-1" />Add</Button></div>
                  <div className="space-y-2">
                    {installments.map((inst, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr,150px,40px] gap-2">
                        <Input value={inst.label} onChange={e => setInstallments(installments.map((x,i)=>i===idx?{...x,label:e.target.value}:x))} />
                        <Input type="number" value={inst.amount} onChange={e => setInstallments(installments.map((x,i)=>i===idx?{...x,amount:+e.target.value}:x))} />
                        <Button variant="ghost" size="icon" onClick={() => setInstallments(installments.filter((_,i)=>i!==idx))}><Trash2 className="h-4 w-4 text-lnx-red-500" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md bg-accent p-3">
                  <span className="text-sm font-medium">Total · {meta.category}</span>
                  <span className="text-xl font-bold tabular text-lnx-teal-500">{INR(total)}</span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>Save & Create Charges</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        } />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {structures.map(s => (
          <Card key={s.id} className="p-5 cursor-pointer hover:border-lnx-teal-500 transition" onClick={() => setDetail(s.id)}>
            <h3 className="font-semibold text-lnx-navy-800">{s.name}</h3>
            <p className="text-xs text-muted-foreground">{s.batch}</p>
            <p className="mt-3 text-2xl font-bold tabular text-lnx-teal-500"><IndianRupee className="h-5 w-5 inline" />{s.total.toLocaleString("en-IN")}</p>
            <div className="mt-3 space-y-1">
              {s.installments.map((i,idx) => (
                <div key={idx} className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{i.label}</span><span className="tabular font-medium">{INR(i.amount)}</span></div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between pt-3 border-t">
              <Badge variant="secondary"><Users className="h-3 w-3 mr-1" />{s.assignedCount} assigned</Badge>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); toast("Edit dialog (using Build Structure form pre-filled)"); }}>Edit</Button>
            </div>
          </Card>
        ))}
      </div>

      <Sheet open={!!detail} onOpenChange={v => !v && setDetail(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px]">
          <SheetHeader><SheetTitle>{sel?.name}</SheetTitle></SheetHeader>
          {sel && (
            <div className="mt-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border p-3"><p className="text-xs text-muted-foreground">Total</p><p className="font-bold tabular text-lnx-teal-500">{INR(sel.total)}</p></div>
                <div className="rounded border p-3"><p className="text-xs text-muted-foreground">Students assigned</p><p className="font-medium">{selStudents.length}</p></div>
              </div>
              <div><p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Installments</p><div className="space-y-1">{sel.installments.map((i,idx)=> <div key={idx} className="flex justify-between rounded border p-2 text-xs"><div><div className="font-medium">{i.label}</div><div className="text-muted-foreground">Due: {new Date(i.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div></div><div className="tabular font-semibold">{INR(i.amount)}</div></div>)}</div></div>
              <div><p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Assigned students ({selStudents.length})</p><div className="space-y-1 max-h-48 overflow-auto">{selStudents.slice(0,40).map(s => <div key={s.id} className="flex justify-between rounded border p-2 text-xs"><span>{s.firstName} {s.lastName}</span><span className="font-mono text-muted-foreground">{s.rollNo}</span></div>)}</div></div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
