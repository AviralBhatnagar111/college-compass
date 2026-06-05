import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { usePlacementStore, useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { Plus, Building2, Briefcase, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/placement/companies")({
  head: () => ({ meta: [{ title: "Companies — LearnNowX" }] }),
  component: CompaniesPage,
});

const tierStyle: Record<string,string> = {
  "Tier 1": "bg-lnx-teal-500/10 text-lnx-teal-500",
  "Tier 2": "bg-lnx-amber-500/10 text-lnx-amber-500",
  "Tier 3": "bg-muted text-muted-foreground",
};

function CompaniesPage() {
  const companies = usePlacementStore(s => s.companies);
  const drives = usePlacementStore(s => s.drives);
  const offers = usePlacementStore(s => s.offers);
  const addCompany = usePlacementStore(s => s.addCompany);
  const addAudit = useAccessStore(s => s.addAudit);
  const { user } = useAccess();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", sector: "IT Services", tier: "Tier 2" as "Tier 1" | "Tier 2" | "Tier 3" });

  const save = () => {
    if (!form.name.trim()) { toast.error("Company name required"); return; }
    const id = `CO_${Date.now().toString(36)}`;
    addCompany({ id, name: form.name.trim(), sector: form.sector, tier: form.tier });
    addAudit({ id: `aud_${id}`, at: new Date().toISOString(), actorId: user?.id ?? "u_tpo_head", module: "Placement", action: `Added company: ${form.name}`, reason: `${form.tier} · ${form.sector}` });
    toast.success("Company added");
    setOpen(false); setForm({ name: "", sector: "IT Services", tier: "Tier 2" });
  };

  const viewing = companies.find(c => c.id === view);

  return (
    <div>
      <PageHeader title="Companies" subtitle={`${companies.length} partner companies`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Company</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add new company</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-2">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Acme Corp" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Sector</Label><Input value={form.sector} onChange={e => setForm({...form, sector: e.target.value})} /></div>
                  <div><Label>Tier</Label>
                    <Select value={form.tier} onValueChange={v => setForm({...form, tier: v as any})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["Tier 1","Tier 2","Tier 3"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Add</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        } />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map(c => {
          const cDrives = drives.filter(d => d.companyId === c.id);
          const cOffers = offers.filter(o => o.companyId === c.id);
          return (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-lg bg-lnx-navy-800 text-white grid place-items-center font-bold">
                    {c.name.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lnx-navy-800">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">{c.sector}</p>
                  </div>
                </div>
                <Badge variant="secondary" className={tierStyle[c.tier]}>{c.tier}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-md bg-accent p-3"><Briefcase className="h-3 w-3 mb-1 text-lnx-teal-500" /><p className="font-semibold tabular text-lg">{cDrives.length}</p><p className="text-muted-foreground">Drives</p></div>
                <div className="rounded-md bg-accent p-3"><Users className="h-3 w-3 mb-1 text-lnx-amber-500" /><p className="font-semibold tabular text-lg">{cOffers.length}</p><p className="text-muted-foreground">Offers</p></div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => setView(c.id)}><Building2 className="h-3 w-3 mr-1" />View Profile</Button>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!view} onOpenChange={(v) => !v && setView(null)}>
        <DialogContent className="max-w-lg">
          {viewing && (
            <>
              <DialogHeader><DialogTitle>{viewing.name}</DialogTitle></DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Sector</span><span className="font-medium">{viewing.sector}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tier</span><Badge variant="secondary" className={tierStyle[viewing.tier]}>{viewing.tier}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Drives</span><span className="font-medium">{drives.filter(d=>d.companyId===viewing.id).length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total offers</span><span className="font-medium">{offers.filter(o=>o.companyId===viewing.id).length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Accepted</span><span className="font-medium text-lnx-green-500">{offers.filter(o=>o.companyId===viewing.id && o.status==="accepted").length}</span></div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
