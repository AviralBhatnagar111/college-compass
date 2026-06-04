import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { KpiCard } from "@/components/common/KpiCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/common/Avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUsersStore, useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { ClipboardCheck, TrendingUp, Star, Award } from "lucide-react";

export const Route = createFileRoute("/_app/people/faculty-appraisal")({
  head: () => ({ meta: [{ title: "Faculty Appraisal — LearnNowX" }] }),
  component: AppraisalPage,
});

type Status = "pending" | "submitted" | "evaluated";
interface Appraisal { facultyId: string; status: Status; selfTeaching: number; selfResearch: number; selfAdmin: number; selfExtension: number; hoiRating?: number; hoiNote?: string; publications: number; fdps: number; feedback: number; }

function AppraisalPage() {
  const { user } = useAccess();
  const users = useUsersStore(s => s.users);
  const addAudit = useAccessStore(s => s.addAudit);
  const audit = (a: string, r?: string) => addAudit({ id: `a_${Date.now()}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hoi", module: "Appraisal", action: a, reason: r });

  const faculty = users.filter(u => ["faculty","lab_faculty","hod"].includes(u.role));

  const [list, setList] = useState<Appraisal[]>(() => faculty.map((f, i) => ({
    facultyId: f.id,
    status: (i % 3 === 0 ? "evaluated" : i % 3 === 1 ? "submitted" : "pending") as Status,
    selfTeaching: 70 + (i*7)%30, selfResearch: 50 + (i*11)%50, selfAdmin: 60 + (i*5)%35, selfExtension: 55 + (i*9)%40,
    hoiRating: i % 3 === 0 ? 70 + (i*3)%25 : undefined,
    hoiNote: i % 3 === 0 ? "Strong teaching, growing research." : undefined,
    publications: (i % 7), fdps: (i % 5), feedback: +(3.5 + ((i*7)%15)/10).toFixed(1),
  })));

  const pending = list.filter(a => a.status === "pending").length;
  const submitted = list.filter(a => a.status === "submitted").length;
  const evaluated = list.filter(a => a.status === "evaluated");
  const avgRating = evaluated.length ? Math.round(evaluated.reduce((s,a)=>s+(a.hoiRating??0),0)/evaluated.length) : 0;

  // Ratings distribution buckets
  const buckets = [{ label: "Outstanding (90+)", min: 90 }, { label: "Very Good (75-89)", min: 75 }, { label: "Good (60-74)", min: 60 }, { label: "Needs Improvement (<60)", min: 0 }];
  const dist = buckets.map((b, i) => {
    const next = buckets[i-1]?.min ?? 101;
    return { ...b, count: evaluated.filter(a => (a.hoiRating ?? 0) >= b.min && (a.hoiRating ?? 0) < next).length };
  });

  const [target, setTarget] = useState<Appraisal | null>(null);
  const [rating, setRating] = useState(75);
  const [note, setNote] = useState("");

  const evaluate = (a: Appraisal) => { setTarget(a); setRating(a.hoiRating ?? 75); setNote(a.hoiNote ?? ""); };
  const submit = () => {
    if (!target) return;
    setList(ls => ls.map(x => x.facultyId === target.facultyId ? { ...x, status: "evaluated", hoiRating: rating, hoiNote: note } : x));
    const fac = users.find(u => u.id === target.facultyId);
    audit(`Evaluated faculty appraisal`, `${fac?.firstName} ${fac?.lastName} · Rating ${rating}/100`);
    toast.success("Appraisal recorded · cascaded to Faculty profile + NAAC C2");
    setTarget(null);
  };

  return (
    <div>
      <PageHeader title="Faculty Appraisal" subtitle="HOI evaluation queue · ratings distribution · publications · FDPs · feedback" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Pending Self-Appraisal" value={pending} icon={ClipboardCheck} tone="amber" />
        <KpiCard label="Awaiting HOI Review" value={submitted} icon={ClipboardCheck} tone="teal" />
        <KpiCard label="Evaluated" value={evaluated.length} icon={Award} tone="green" />
        <KpiCard label="Avg Rating" value={`${avgRating}/100`} icon={Star} />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {dist.map(d => (
          <Card key={d.label} className="p-4"><div className="text-xs text-muted-foreground">{d.label}</div><div className="text-2xl font-bold text-lnx-navy-800 tabular mt-1">{d.count}</div></Card>
        ))}
        <Card className="p-4 bg-lnx-teal-500/5"><div className="text-xs text-muted-foreground">Highest Avg by Department</div><div className="text-base font-semibold text-lnx-navy-800 mt-1 flex items-center gap-1"><TrendingUp className="h-4 w-4 text-lnx-green-500" />CSE</div></Card>
      </div>

      <Card className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Faculty</TableHead><TableHead>Dept</TableHead><TableHead className="text-center">Publications</TableHead><TableHead className="text-center">FDPs</TableHead><TableHead className="text-center">Feedback</TableHead><TableHead className="text-center">HOI Rating</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>{list.map(a => {
            const f = users.find(u => u.id === a.facultyId);
            if (!f) return null;
            return (<TableRow key={a.facultyId}>
              <TableCell><div className="flex items-center gap-2"><Avatar firstName={f.firstName} lastName={f.lastName} color={f.avatarColor} size="sm" /><div><div className="text-sm font-medium">{f.firstName} {f.lastName}</div><div className="text-xs text-muted-foreground">{f.designation}</div></div></div></TableCell>
              <TableCell><Badge variant="outline">{f.department ?? "—"}</Badge></TableCell>
              <TableCell className="text-center tabular">{a.publications}</TableCell>
              <TableCell className="text-center tabular">{a.fdps}</TableCell>
              <TableCell className="text-center"><span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-lnx-amber-500 fill-current" />{a.feedback}</span></TableCell>
              <TableCell className="text-center tabular">{a.hoiRating ?? "—"}</TableCell>
              <TableCell><Badge variant={a.status==="evaluated"?"secondary":"outline"} className={a.status==="evaluated"?"bg-lnx-green-500/10 text-lnx-green-500":""}>{a.status}</Badge></TableCell>
              <TableCell className="text-right">{a.status !== "evaluated" && <Button size="sm" onClick={()=>evaluate(a)}>Evaluate</Button>}{a.status === "evaluated" && <Button size="sm" variant="ghost" onClick={()=>evaluate(a)}>Edit</Button>}</TableCell>
            </TableRow>);
          })}</TableBody>
        </Table>
      </Card>

      <Dialog open={!!target} onOpenChange={o=>!o&&setTarget(null)}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>HOI Evaluation</DialogTitle></DialogHeader>
          {target && (() => { const f = users.find(u => u.id === target.facultyId); return (
            <div className="space-y-4 py-2">
              <div className="text-sm text-muted-foreground">Faculty: <span className="font-medium text-lnx-navy-800">{f?.firstName} {f?.lastName}</span> · {f?.department}</div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="border rounded p-2"><div className="text-muted-foreground">Teaching (self)</div><div className="font-semibold tabular">{target.selfTeaching}/100</div></div>
                <div className="border rounded p-2"><div className="text-muted-foreground">Research (self)</div><div className="font-semibold tabular">{target.selfResearch}/100</div></div>
                <div className="border rounded p-2"><div className="text-muted-foreground">Admin (self)</div><div className="font-semibold tabular">{target.selfAdmin}/100</div></div>
                <div className="border rounded p-2"><div className="text-muted-foreground">Extension (self)</div><div className="font-semibold tabular">{target.selfExtension}/100</div></div>
              </div>
              <div><Label>HOI rating: <span className="font-semibold tabular ml-2">{rating}/100</span></Label>
                <Slider value={[rating]} onValueChange={v=>setRating(v[0])} max={100} step={1} className="mt-2" />
              </div>
              <div><Label>Evaluation note</Label><Textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} placeholder="Strengths, growth areas, recommendations…" /></div>
            </div>
          ); })()}
          <DialogFooter><Button variant="outline" onClick={()=>setTarget(null)}>Cancel</Button><Button onClick={submit}>Save Evaluation</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
