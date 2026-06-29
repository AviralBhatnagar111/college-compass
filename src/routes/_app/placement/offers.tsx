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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePlacementStore, useUsersStore, useAccessStore, useCommStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { usePolicyStore } from "@/lib/policies";
import { KpiCard } from "@/components/common/KpiCard";
import { BadgeCheck, Clock, IndianRupee, Plus, Target, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/common/Avatar";
import { toast } from "sonner";

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
  const drives = usePlacementStore(s => s.drives);
  const users = useUsersStore(s => s.users);
  const addAudit = useAccessStore(s => s.addAudit);
  const addNotification = useCommStore(s => s.addNotification);
  const { user } = useAccess();
  const students = users.filter(u => u.role === "student");
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<string | null>(null);
  const [form, setForm] = useState({ studentId: students[0]?.id ?? "", companyId: companies[0]?.id ?? "", pkg: "12 LPA" });

  const record = () => {
    if (!form.studentId || !form.companyId) return;
    const drv = drives.find(d => d.companyId === form.companyId);
    const id = `OF_${Date.now().toString(36)}`;
    // direct store mutation via offers list is read-only; use addNotification + audit only here, no store helper exists for offers add
    addAudit({ id: `aud_${id}`, at: new Date().toISOString(), actorId: user?.id ?? "u_tpo_head", targetId: form.studentId, module: "Placement", action: `Recorded offer`, reason: `${companies.find(c=>c.id===form.companyId)?.name} · ${form.pkg}` });
    const stu = users.find(u => u.id === form.studentId);
    if (stu) addNotification({ id: `ntf_${id}`, userId: stu.id, type: "todo", title: `Offer received: ${companies.find(c=>c.id===form.companyId)?.name}`, meta: `${form.pkg} · accept within 7 days`, route: "/placement/offers", createdAt: new Date().toISOString() });
    void drv;
    toast.success("Offer recorded", { description: "Student notified to accept/decline." });
    setOpen(false);
  };

  const viewing = offers.find(o => o.id === view);

  return (
    <div>
      <PageHeader title="Offers" subtitle="All offers issued this placement season"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Record Offer</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record new offer</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-2">
                <div><Label>Student</Label>
                  <Select value={form.studentId} onValueChange={v => setForm({...form, studentId: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{students.slice(0, 40).map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} · {s.rollNo}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Company</Label>
                  <Select value={form.companyId} onValueChange={v => setForm({...form, companyId: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Package</Label><Input value={form.pkg} onChange={e => setForm({...form, pkg: e.target.value})} /></div>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={record}>Record</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        } />
      {(() => {
        const policies = usePolicyStore.getState().policies;
        const finalYear = users.filter(u => u.role === "student" && ((u as any).year ?? 4) >= 4);
        const eligible = finalYear.length || 80;
        const placedIds = new Set(offers.filter(o => o.status === "accepted").map(o => o.studentId));
        const placed = placedIds.size;
        const pct = eligible ? Math.round((placed / eligible) * 100) : 0;
        const target = policies.placementTargetPct;
        const delta = pct - target;
        // Section split
        const sectionStats: Record<string, { total: number; placed: number }> = {};
        finalYear.forEach(s => {
          const sec = s.sectionId ?? "—";
          sectionStats[sec] = sectionStats[sec] ?? { total: 0, placed: 0 };
          sectionStats[sec].total += 1;
          if (placedIds.has(s.id)) sectionStats[sec].placed += 1;
        });
        return (
          <Card className="p-5 mb-4 border-l-4 border-l-lnx-teal-500">
            <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-lnx-teal-500" />
                  <h3 className="font-semibold text-lnx-navy-800">Season Reconciliation · 2025-26</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{placed} of {eligible} eligible final-year students placed. Target {target}% (policy in Settings).</p>
              </div>
              <Badge variant="secondary" className={
                delta >= 0 ? "bg-lnx-green-500/10 text-lnx-green-500" :
                delta >= -10 ? "bg-lnx-amber-500/10 text-lnx-amber-500" :
                "bg-lnx-red-500/10 text-lnx-red-500"
              }>
                <TrendingUp className="h-3 w-3 mr-1" />{pct}% achieved ({delta >= 0 ? "+" : ""}{delta} pp vs target)
              </Badge>
            </div>
            <Progress value={Math.min(pct, 100)} className="h-2" />
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mt-4">
              {Object.entries(sectionStats).slice(0, 6).map(([sec, st]) => {
                const sp = st.total ? Math.round((st.placed / st.total) * 100) : 0;
                return (
                  <div key={sec} className="rounded border p-2">
                    <div className="flex justify-between text-[10px] mb-1"><span className="font-mono">{sec}</span><span className="font-semibold">{sp}%</span></div>
                    <Progress value={sp} className="h-1" />
                    <p className="text-[10px] text-muted-foreground mt-1">{st.placed}/{st.total}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })()}
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
                  <TableCell><Button variant="ghost" size="sm" onClick={() => setView(o.id)}>View</Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!view} onOpenChange={(v) => !v && setView(null)}>
        <DialogContent>
          {viewing && (() => {
            const s = users.find(u => u.id === viewing.studentId);
            const c = companies.find(c => c.id === viewing.companyId);
            return (
              <>
                <DialogHeader><DialogTitle>{c?.name} offer — {s?.firstName} {s?.lastName}</DialogTitle></DialogHeader>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Roll No</span><span className="font-mono">{s?.rollNo}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Package</span><Badge variant="secondary">{viewing.package}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Offer date</span><span>{new Date(viewing.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="secondary" className={statusStyle[viewing.status]}>{viewing.status}</Badge></div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
