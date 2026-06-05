import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePlacementStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { Plus, ArrowRight, Briefcase, Clock, CheckCircle2 } from "lucide-react";
import { KpiCard } from "@/components/common/KpiCard";
import { createDriveCascade } from "@/lib/cascade";
import { toast } from "sonner";

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
  const { user } = useAccess();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ companyId: companies[0]?.id ?? "", role: "Software Engineer", pkg: "12 LPA", cgpa: "7.0", start: new Date().toISOString().slice(0,10), end: new Date(Date.now()+14*864e5).toISOString().slice(0,10) });

  const save = () => {
    if (!form.companyId || !form.role) { toast.error("Company and role required"); return; }
    const id = `DRV_${Date.now().toString(36)}`;
    createDriveCascade({
      id, companyId: form.companyId, role: form.role, package: form.pkg,
      branches: ["CSE","ECE"], cgpaCutoff: parseFloat(form.cgpa) || 7.0, backlogsAllowed: false,
      startDate: form.start, endDate: form.end,
      appliedIds: [], shortlistedIds: [], selectedIds: [], status: "upcoming",
    }, user?.id ?? "u_tpo_head");
    toast.success("Drive created", { description: "All eligible students notified." });
    setOpen(false);
  };

  return (
    <div>
      <PageHeader title="Drives" subtitle="Active, upcoming and completed placement drives"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Drive</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create placement drive</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-2">
                <div><Label>Company</Label>
                  <Select value={form.companyId} onValueChange={v => setForm({ ...form, companyId: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Role</Label><Input value={form.role} onChange={e => setForm({...form, role: e.target.value})} /></div>
                  <div><Label>Package</Label><Input value={form.pkg} onChange={e => setForm({...form, pkg: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>CGPA cutoff</Label><Input value={form.cgpa} onChange={e => setForm({...form, cgpa: e.target.value})} /></div>
                  <div><Label>Start</Label><Input type="date" value={form.start} onChange={e => setForm({...form, start: e.target.value})} /></div>
                  <div><Label>End</Label><Input type="date" value={form.end} onChange={e => setForm({...form, end: e.target.value})} /></div>
                </div>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Create &amp; Notify</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        } />
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
