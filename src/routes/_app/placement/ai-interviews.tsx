import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { usePlacementStore, useUsersStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { Bot, Mic, Video, Sparkles, Plus } from "lucide-react";
import { KpiCard } from "@/components/common/KpiCard";
import { Avatar } from "@/components/common/Avatar";
import { reviewAiInterviewCascade } from "@/lib/cascade";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/placement/ai-interviews")({
  head: () => ({ meta: [{ title: "AI Interviews — LearnNowX" }] }),
  component: AiInterviewsPage,
});

function AiInterviewsPage() {
  const ai = usePlacementStore(s => s.ai);
  const users = useUsersStore(s => s.users);
  const { user } = useAccess();
  const avg = Math.round(ai.reduce((s,a)=>s+a.score,0)/ai.length);
  const [view, setView] = useState<string | null>(null);
  const [override, setOverride] = useState("");

  const item = ai.find(a => a.id === view);
  const stu = item ? users.find(u => u.id === item.studentId) : null;

  const submit = () => {
    if (!item || !stu) return;
    const score = parseInt(override, 10);
    if (isNaN(score) || score < 0 || score > 100) { toast.error("Score 0–100"); return; }
    reviewAiInterviewCascade(stu.id, score, user?.id ?? "u_tpo_head");
    toast.success("Review saved", { description: `Final score ${score}/100 sent to ${stu.firstName}` });
    setView(null); setOverride("");
  };

  return (
    <div>
      <PageHeader title="AI Interviews" subtitle="Voice + video interviews evaluated by Lovable AI" action={<Button><Plus className="h-4 w-4 mr-2" />New Round</Button>} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Attempts" value={ai.length} icon={Bot} tone="teal" />
        <KpiCard label="Avg Score" value={`${avg}/100`} icon={Sparkles} tone="amber" />
        <KpiCard label="Pass Rate (75+)" value={`${Math.round(ai.filter(a=>a.score>=75).length/ai.length*100)}%`} icon={Mic} tone="green" />
        <KpiCard label="Avg Duration" value={`${Math.round(ai.reduce((s,a)=>s+a.durationMins,0)/ai.length)} min`} icon={Video} />
      </div>
      <Card className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Candidate</TableHead><TableHead>Score</TableHead><TableHead>Fluency</TableHead><TableHead>Technical</TableHead><TableHead>Confidence</TableHead><TableHead>Duration</TableHead><TableHead>Language</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {ai.map(a => {
              const s = users.find(u => u.id === a.studentId);
              const f = Math.min(100, a.score + (a.id.charCodeAt(3)%10) - 5);
              const t = Math.min(100, a.score - (a.id.charCodeAt(3)%8) + 4);
              const c = Math.min(100, a.score + (a.id.charCodeAt(3)%6));
              if (!s) return null;
              return (
                <TableRow key={a.id}>
                  <TableCell><div className="flex items-center gap-2"><Avatar firstName={s.firstName} lastName={s.lastName} color={s.avatarColor} size="sm" /><div><p className="font-medium text-sm">{s.firstName} {s.lastName}</p><p className="text-xs text-muted-foreground">{s.rollNo}</p></div></div></TableCell>
                  <TableCell><Badge variant="secondary" className={a.score>=75?"bg-lnx-green-500/10 text-lnx-green-500":a.score>=60?"bg-lnx-amber-500/10 text-lnx-amber-500":"bg-lnx-red-500/10 text-lnx-red-500"}>{a.score}/100</Badge></TableCell>
                  <TableCell><Bar v={f} /></TableCell>
                  <TableCell><Bar v={t} /></TableCell>
                  <TableCell><Bar v={c} /></TableCell>
                  <TableCell>{a.durationMins} min</TableCell>
                  <TableCell>{a.language}</TableCell>
                  <TableCell><Button variant="ghost" size="sm" onClick={() => { setView(a.id); setOverride(String(a.score)); }}>Review</Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!view} onOpenChange={(v) => !v && setView(null)}>
        <DialogContent>
          {item && stu && (
            <>
              <DialogHeader><DialogTitle>{stu.firstName} {stu.lastName} — AI Interview</DialogTitle></DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground italic">
                  "Tell me about a time you solved a tricky concurrency bug…" — candidate answered concisely; identified deadlock, used mutex; AI flagged minor pacing issues.
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-md bg-accent p-2"><p className="font-semibold">{item.score}</p><p className="text-muted-foreground">AI Score</p></div>
                  <div className="rounded-md bg-accent p-2"><p className="font-semibold">{item.durationMins} min</p><p className="text-muted-foreground">Duration</p></div>
                  <div className="rounded-md bg-accent p-2"><p className="font-semibold">{item.language}</p><p className="text-muted-foreground">Language</p></div>
                </div>
                <div>
                  <Label>TPO Final Score (override)</Label>
                  <Input type="number" min={0} max={100} value={override} onChange={e => setOverride(e.target.value)} />
                </div>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setView(null)}>Close</Button><Button onClick={submit}>Save Review</Button></DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Bar({ v }: { v: number }) {
  return <div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-lnx-teal-500" style={{ width: `${v}%` }} /></div><span className="text-xs tabular text-muted-foreground w-8">{v}</span></div>;
}
