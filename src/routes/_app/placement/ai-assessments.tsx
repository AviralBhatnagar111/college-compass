import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { usePlacementStore } from "@/stores";
import { Plus, Bot, ListChecks, Sparkles, Wand2, PlayCircle } from "lucide-react";
import { useState } from "react";
import { KpiCard } from "@/components/common/KpiCard";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/placement/ai-assessments")({
  head: () => ({ meta: [{ title: "AI Assessments — LearnNowX" }] }),
  component: AssessmentsPage,
});

const ASSESSMENTS = [
  { id: "A1", name: "Infosys SDE Round-1 (MCQ)", profile: "JP_SDE", qty: 30, durationMins: 45, attempts: 28, avgScore: 72, status: "active" },
  { id: "A2", name: "TCS NQT Practice", profile: "JP_SDE", qty: 40, durationMins: 60, attempts: 42, avgScore: 68, status: "active" },
  { id: "A3", name: "Razorpay Backend Screen", profile: "JP_SDE", qty: 25, durationMins: 40, attempts: 9, avgScore: 81, status: "active" },
  { id: "A4", name: "Data Analyst Foundations", profile: "JP_DA", qty: 20, durationMins: 30, attempts: 15, avgScore: 65, status: "draft" },
];

function AssessmentsPage() {
  const profiles = usePlacementStore(s => s.jobProfiles);
  const drives = usePlacementStore(s => s.drives);
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState([30]);
  const [dur, setDur] = useState([45]);

  return (
    <div>
      <PageHeader title="AI Assessments" subtitle="Generate adaptive MCQ assessments per drive or job profile"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Create Assessment</Button></DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-lnx-teal-500" />New AI Assessment</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div><Label>Name</Label><Input placeholder="e.g. Microsoft SDE Intern Round-1" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Job Profile</Label>
                    <Select defaultValue={profiles[0].id}><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Link to Drive (optional)</Label>
                    <Select><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>{drives.map(d => <SelectItem key={d.id} value={d.id}>{d.role}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label className="flex items-center justify-between">Number of questions <span className="text-lnx-teal-500 font-semibold tabular">{qty[0]}</span></Label>
                  <Slider value={qty} onValueChange={setQty} min={10} max={60} step={5} className="mt-2" /></div>
                <div><Label className="flex items-center justify-between">Duration (minutes) <span className="text-lnx-teal-500 font-semibold tabular">{dur[0]}</span></Label>
                  <Slider value={dur} onValueChange={setDur} min={15} max={120} step={5} className="mt-2" /></div>
                <div><Label>Topics & weightage (AI will generate)</Label>
                  <Textarea defaultValue="DSA - 40%, DBMS - 25%, OS - 15%, Networks - 10%, Aptitude - 10%" rows={3} /></div>
                <div className="rounded-md bg-lnx-teal-500/5 border border-lnx-teal-500/20 p-3 text-xs">
                  <Wand2 className="h-3 w-3 inline mr-1 text-lnx-teal-500" />Lovable AI will draft {qty[0]} questions calibrated to chosen weightage.
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => { toast.success("Assessment created", { description: `${qty[0]} questions ready for review` }); setOpen(false); }}>Generate & Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        } />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Live Assessments" value={ASSESSMENTS.filter(a=>a.status==="active").length} icon={Bot} tone="teal" />
        <KpiCard label="Total Attempts" value={ASSESSMENTS.reduce((s,a)=>s+a.attempts,0)} icon={ListChecks} />
        <KpiCard label="Avg Score" value={`${Math.round(ASSESSMENTS.reduce((s,a)=>s+a.avgScore,0)/ASSESSMENTS.length)}%`} icon={Sparkles} tone="amber" />
        <KpiCard label="Drafts" value={ASSESSMENTS.filter(a=>a.status==="draft").length} icon={Bot} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ASSESSMENTS.map(a => (
          <Card key={a.id} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lnx-navy-800">{a.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{profiles.find(p=>p.id===a.profile)?.name} · {a.qty} Q · {a.durationMins} min</p>
              </div>
              <Badge variant="secondary" className={a.status==="active"?"bg-lnx-green-500/10 text-lnx-green-500":""}>{a.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
              <div><p className="text-muted-foreground">Attempts</p><p className="text-xl font-semibold tabular">{a.attempts}</p></div>
              <div><p className="text-muted-foreground">Avg Score</p><p className="text-xl font-semibold tabular text-lnx-teal-500">{a.avgScore}%</p></div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">Analytics</Button>
              <Button asChild size="sm" className="flex-1"><Link to="/placement/ai-assessments/take" search={{ id: a.id }}><PlayCircle className="h-3 w-3 mr-1" />Preview</Link></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
