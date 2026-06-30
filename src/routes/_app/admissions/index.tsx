import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { GraduationCap, UserPlus, Search, TrendingUp, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admissions/")({
  head: () => ({ meta: [{ title: "Admissions — LearnNowX" }] }),
  component: AdmissionsPage,
});

type Stage = "enquiry" | "application" | "shortlist" | "offer" | "enrolled";
interface Applicant {
  id: string; name: string; program: string; stage: Stage;
  score: number; phone: string; source: string; createdAt: string;
}

const PROGRAMS = ["B.Tech CSE", "B.Tech ECE", "B.Tech ME", "B.Tech CIVIL", "B.Tech BIOTECH", "MBA"];
const INTAKE: Record<string, { target: number; filled: number }> = {
  "B.Tech CSE": { target: 60, filled: 40 },
  "B.Tech ECE": { target: 60, filled: 30 },
  "B.Tech ME": { target: 60, filled: 25 },
  "B.Tech CIVIL": { target: 60, filled: 25 },
  "B.Tech BIOTECH": { target: 30, filled: 20 },
  "MBA": { target: 60, filled: 0 },
};

const SEED: Applicant[] = Array.from({ length: 48 }).map((_, i) => {
  const stages: Stage[] = ["enquiry", "application", "shortlist", "offer", "enrolled"];
  const fns = ["Arjun", "Priya", "Rahul", "Sneha", "Vikram", "Anjali", "Karan", "Meera", "Rohan", "Diya"];
  const lns = ["Sharma", "Patel", "Iyer", "Reddy", "Nair", "Gupta", "Khanna", "Pillai", "Bose", "Mehta"];
  return {
    id: `app_${1000 + i}`,
    name: `${fns[i % fns.length]} ${lns[(i * 3) % lns.length]}`,
    program: PROGRAMS[i % PROGRAMS.length],
    stage: stages[i % 5],
    score: 60 + ((i * 7) % 35),
    phone: `+91 9${String(800000000 + i * 13).slice(0, 9)}`,
    source: ["Website", "Education Fair", "Referral", "Counsellor"][i % 4],
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  };
});

function AdmissionsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>(SEED);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Stage | "all">("all");
  const [open, setOpen] = useState<Applicant | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", program: PROGRAMS[0], phone: "", source: "Website" });
  const addAudit = useAccessStore(s => s.addAudit);
  const { user } = useAccess();

  const counts = useMemo(() => {
    const c: Record<Stage, number> = { enquiry: 0, application: 0, shortlist: 0, offer: 0, enrolled: 0 };
    applicants.forEach(a => { c[a.stage]++; });
    return c;
  }, [applicants]);

  const filtered = useMemo(() => applicants.filter(a =>
    (tab === "all" || a.stage === tab) &&
    (q === "" || a.name.toLowerCase().includes(q.toLowerCase()) || a.program.toLowerCase().includes(q.toLowerCase()))
  ), [applicants, tab, q]);

  const advance = (id: string) => {
    const order: Stage[] = ["enquiry", "application", "shortlist", "offer", "enrolled"];
    setApplicants(prev => prev.map(a => {
      if (a.id !== id) return a;
      const idx = order.indexOf(a.stage);
      const next = order[Math.min(idx + 1, order.length - 1)];
      addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? "u_registrar", module: "Admissions", action: `${a.name}: ${a.stage} → ${next}` });
      toast.success(`Moved to ${next}`);
      return { ...a, stage: next };
    }));
    setOpen(prev => prev && prev.id === id ? { ...prev, stage: order[Math.min(order.indexOf(prev.stage) + 1, 4)] } : prev);
  };

  const create = () => {
    if (!draft.name.trim() || !draft.phone.trim()) return toast.error("Name and phone required");
    const a: Applicant = { id: `app_${Date.now().toString(36)}`, ...draft, stage: "enquiry", score: 0, createdAt: new Date().toISOString() };
    setApplicants(p => [a, ...p]);
    addAudit({ id: `aud_${Date.now().toString(36)}`, at: a.createdAt, actorId: user?.id ?? "u_registrar", module: "Admissions", action: `New enquiry: ${a.name} (${a.program})` });
    toast.success("Enquiry captured");
    setAddOpen(false); setDraft({ name: "", program: PROGRAMS[0], phone: "", source: "Website" });
  };

  return (
    <div>
      <PageHeader title="Admissions" subtitle="Enquiries → Applications → Shortlist → Offers → Enrolment" action={<Button onClick={() => setAddOpen(true)}><UserPlus className="h-4 w-4 mr-2" />New Enquiry</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {(Object.keys(counts) as Stage[]).map((s, i) => (
          <Card key={s} className="p-4 cursor-pointer" onClick={() => setTab(s)}>
            <div className="text-xs text-muted-foreground capitalize">{s}</div>
            <div className="mt-1 text-2xl font-semibold text-lnx-navy-800 tabular">{counts[s]}</div>
            {i < 4 && <ArrowRight className="h-3 w-3 mt-1 text-muted-foreground" />}
          </Card>
        ))}
      </div>

      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lnx-navy-800 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-lnx-teal-500" />Intake vs Target</h3>
          <Link to="/dashboard" className="text-xs text-lnx-teal-500">See on dashboard →</Link>
        </div>
        <div className="space-y-3">
          {Object.entries(INTAKE).map(([prog, v]) => (
            <div key={prog}>
              <div className="flex justify-between text-sm mb-1"><span>{prog}</span><span className="tabular">{v.filled}/{v.target}</span></div>
              <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-lnx-teal-500" style={{ width: `${(v.filled/v.target)*100}%` }} /></div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search applicants…" className="pl-9" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <Tabs value={tab} onValueChange={v => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="enquiry">Enquiry</TabsTrigger>
            <TabsTrigger value="application">Application</TabsTrigger>
            <TabsTrigger value="shortlist">Shortlist</TabsTrigger>
            <TabsTrigger value="offer">Offer</TabsTrigger>
            <TabsTrigger value="enrolled">Enrolled</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <Tabs value={tab} onValueChange={v => setTab(v as any)}>
          <TabsContent value={tab} className="m-0">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Program</TableHead><TableHead>Stage</TableHead><TableHead>Score</TableHead><TableHead>Source</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map(a => (
                  <TableRow key={a.id} className="cursor-pointer" onClick={() => setOpen(a)}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{a.program}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{a.stage}</Badge></TableCell>
                    <TableCell className="tabular">{a.score}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.source}</TableCell>
                    <TableCell><Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); advance(a.id); }}>Advance</Button></TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No applicants match.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </Card>

      <Sheet open={!!open} onOpenChange={v => !v && setOpen(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {open && (
            <>
              <SheetHeader><SheetTitle>{open.name}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-3 text-sm">
                <Row label="Program" value={open.program} />
                <Row label="Stage" value={open.stage} />
                <Row label="Entrance Score" value={String(open.score)} />
                <Row label="Phone" value={open.phone} />
                <Row label="Source" value={open.source} />
                <Row label="Captured" value={new Date(open.createdAt).toLocaleDateString()} />
              </div>
              <div className="mt-6 flex gap-2">
                <Button className="flex-1" onClick={() => advance(open.id)} disabled={open.stage === "enrolled"}>{open.stage === "enrolled" ? "Already enrolled" : "Advance stage"}</Button>
                <Button variant="outline" onClick={() => setOpen(null)}>Close</Button>
              </div>
              {open.stage === "enrolled" && <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1"><GraduationCap className="h-3 w-3" />Student & parent records auto-created on enrolment.</p>}
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Enquiry</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></div>
            <div><Label>Program</Label>
              <Select value={draft.program} onValueChange={v => setDraft({ ...draft, program: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROGRAMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Phone</Label><Input value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} /></div>
            <div><Label>Source</Label>
              <Select value={draft.source} onValueChange={v => setDraft({ ...draft, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Website", "Education Fair", "Referral", "Counsellor"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={create}>Capture enquiry</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}
