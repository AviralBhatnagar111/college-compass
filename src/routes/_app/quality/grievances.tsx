import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { KpiCard } from "@/components/common/KpiCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { AlertOctagon, Shield, Lock, MessageSquare, Send, Plus, CheckCircle2, ArrowUp, Star } from "lucide-react";

export const Route = createFileRoute("/_app/quality/grievances")({
  head: () => ({ meta: [{ title: "Grievances & Feedback — LearnNowX" }] }),
  component: GrievancesPage,
});

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };

interface Grievance { id: string; raisedBy: string; role: "student" | "faculty" | "parent"; category: string; subject: string; details: string; status: "open" | "in-progress" | "resolved" | "escalated"; owner?: string; raisedAt: string; resolution?: string; }
interface Survey { id: string; name: string; type: "satisfaction" | "course" | "exit" | "parent" | "alumni"; launched: string; responses: number; target: number; avgScore: number; status: "active" | "closed"; }

function GrievancesPage() {
  const { user } = useAccess();
  const addAudit = useAccessStore(s => s.addAudit);
  const audit = (action: string, reason?: string) => addAudit({ id: `a_${Date.now()}_${Math.random()}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hoi", module: "Grievances", action, reason });

  const [grievances, setGrievances] = useState<Grievance[]>([
    { id: "G1", raisedBy: "Vikas Chauhan", role: "student", category: "Academic", subject: "Marks recount request for DBMS Internal-2", details: "I believe Q4 was marked incorrectly. Requesting recount.", status: "open", raisedAt: daysAgo(2) },
    { id: "G2", raisedBy: "Mahesh Chauhan", role: "parent", category: "Fee", subject: "Late fee waiver request", details: "Payment delay due to bank issue. Documentation attached.", status: "in-progress", owner: "Priya Deshmukh (Finance)", raisedAt: daysAgo(5) },
    { id: "G3", raisedBy: "Anonymous", role: "student", category: "Anti-Ragging", subject: "Verbal harassment in hostel block C", details: "Senior students passing inappropriate remarks. Identity withheld.", status: "escalated", owner: "Anti-Ragging Committee", raisedAt: daysAgo(7) },
    { id: "G4", raisedBy: "Ananya Sharma", role: "student", category: "Infrastructure", subject: "Lab equipment shortage in CSE-A2", details: "Only 15 working systems for 20 students.", status: "resolved", owner: "HOD CSE", raisedAt: daysAgo(14), resolution: "5 new systems procured. Closed." },
    { id: "G5", raisedBy: "Faculty (Confidential)", role: "faculty", category: "ICC", subject: "Workplace concern", details: "[Restricted access]", status: "in-progress", owner: "ICC Chairperson", raisedAt: daysAgo(4) },
  ]);

  const [surveys, setSurveys] = useState<Survey[]>([
    { id: "S1", name: "Student Satisfaction Survey 2025-26", type: "satisfaction", launched: daysAgo(20), responses: 118, target: 140, avgScore: 4.1, status: "active" },
    { id: "S2", name: "Course Feedback — DBMS (CS301)", type: "course", launched: daysAgo(10), responses: 38, target: 40, avgScore: 4.4, status: "active" },
    { id: "S3", name: "Exit Feedback — Batch 2022-26", type: "exit", launched: daysAgo(40), responses: 24, target: 30, avgScore: 4.0, status: "active" },
    { id: "S4", name: "Parent Feedback (Half-yearly)", type: "parent", launched: daysAgo(60), responses: 102, target: 140, avgScore: 3.9, status: "closed" },
    { id: "S5", name: "Alumni Engagement Survey", type: "alumni", launched: daysAgo(90), responses: 56, target: 120, avgScore: 4.2, status: "closed" },
  ]);

  // Anti-ragging incidents (statutory register)
  const ragging = [
    { id: "AR1", date: daysAgo(7), description: "Verbal harassment incident — hostel C", status: "Under investigation", action: "Statements recorded" },
    { id: "AR2", date: daysAgo(60), description: "Group-chat unwelcome messages", status: "Closed", action: "Counselling + warning issued" },
  ];

  const open = grievances.filter(g => g.status === "open").length;
  const inProg = grievances.filter(g => g.status === "in-progress").length;
  const escalated = grievances.filter(g => g.status === "escalated").length;
  const resolved = grievances.filter(g => g.status === "resolved").length;

  // Assign owner / resolve dialogs
  const [assignTarget, setAssignTarget] = useState<Grievance | null>(null);
  const [assignOwner, setAssignOwner] = useState("");
  const doAssign = () => {
    if (!assignTarget || !assignOwner) return;
    setGrievances(gs => gs.map(g => g.id === assignTarget.id ? { ...g, owner: assignOwner, status: "in-progress" } : g));
    audit(`Assigned grievance owner`, `${assignTarget.subject} → ${assignOwner}`);
    toast.success(`Assigned to ${assignOwner}`);
    setAssignTarget(null); setAssignOwner("");
  };

  const [resolveTarget, setResolveTarget] = useState<Grievance | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const doResolve = () => {
    if (!resolveTarget || !resolveNote) return;
    setGrievances(gs => gs.map(g => g.id === resolveTarget.id ? { ...g, status: "resolved", resolution: resolveNote } : g));
    audit(`Resolved grievance`, `${resolveTarget.subject} — ${resolveNote}`);
    toast.success("Grievance resolved · raiser notified");
    setResolveTarget(null); setResolveNote("");
  };

  const escalate = (g: Grievance) => {
    setGrievances(gs => gs.map(x => x.id === g.id ? { ...x, status: "escalated" } : x));
    audit(`Escalated grievance`, g.subject);
    toast.warning("Escalated to Director");
  };

  // Launch survey dialog
  const [launchOpen, setLaunchOpen] = useState(false);
  const [ls, setLs] = useState<{ name: string; type: Survey["type"]; target: number }>({ name: "", type: "satisfaction", target: 140 });
  const launchSurvey = () => {
    if (!ls.name) { toast.error("Survey name required"); return; }
    const s: Survey = { id: `S_${Date.now()}`, name: ls.name, type: ls.type, launched: new Date().toISOString(), responses: 0, target: ls.target, avgScore: 0, status: "active" };
    setSurveys([s, ...surveys]);
    audit(`Launched feedback survey`, ls.name);
    toast.success(`Survey launched · ${ls.target} invites sent`);
    setLaunchOpen(false); setLs({ name: "", type: "satisfaction", target: 140 });
  };

  return (
    <div>
      <PageHeader title="Grievances & Feedback" subtitle="Grievance redressal · Anti-Ragging · ICC · Feedback surveys"
        action={<Button onClick={() => setLaunchOpen(true)}><Send className="h-4 w-4 mr-2" />Launch Survey</Button>} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Open" value={open} icon={AlertOctagon} tone="amber" />
        <KpiCard label="In Progress" value={inProg} icon={MessageSquare} tone="teal" />
        <KpiCard label="Escalated" value={escalated} icon={ArrowUp} tone="red" />
        <KpiCard label="Resolved (YTD)" value={resolved} icon={CheckCircle2} tone="green" />
      </div>

      <Tabs defaultValue="grievances">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="grievances">Redressal</TabsTrigger>
          <TabsTrigger value="ragging">Anti-Ragging</TabsTrigger>
          <TabsTrigger value="icc">ICC</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="grievances" className="mt-4"><Card className="p-0">
          <Table><TableHeader><TableRow><TableHead>Raised By</TableHead><TableHead>Category</TableHead><TableHead>Subject</TableHead><TableHead>Owner</TableHead><TableHead>Age</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>{grievances.map(g => {
              const age = Math.round((Date.now() - new Date(g.raisedAt).getTime()) / 86400000);
              return (<TableRow key={g.id}>
                <TableCell><div className="text-sm font-medium">{g.raisedBy}</div><div className="text-xs text-muted-foreground capitalize">{g.role}</div></TableCell>
                <TableCell><Badge variant="outline">{g.category}</Badge></TableCell>
                <TableCell className="max-w-xs"><div className="text-sm">{g.subject}</div></TableCell>
                <TableCell className="text-xs">{g.owner ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                <TableCell><Badge variant={age>3?"destructive":"secondary"} className={age<=3?"bg-lnx-green-500/10 text-lnx-green-500":""}>{age}d</Badge></TableCell>
                <TableCell><Badge variant={g.status==="resolved"?"secondary":g.status==="escalated"?"destructive":"outline"} className={g.status==="resolved"?"bg-lnx-green-500/10 text-lnx-green-500":""}>{g.status}</Badge></TableCell>
                <TableCell className="text-right">
                  {g.status !== "resolved" && g.status !== "escalated" && <Button variant="ghost" size="sm" onClick={()=>{setAssignTarget(g); setAssignOwner(g.owner ?? "");}}>Assign</Button>}
                  {g.status !== "resolved" && <Button variant="ghost" size="sm" onClick={()=>{setResolveTarget(g); setResolveNote("");}}>Resolve</Button>}
                  {g.status === "open" && age > 3 && <Button variant="ghost" size="sm" onClick={()=>escalate(g)} className="text-lnx-red-500">Escalate</Button>}
                </TableCell>
              </TableRow>);
            })}</TableBody></Table></Card>
        </TabsContent>

        <TabsContent value="ragging" className="mt-4 space-y-4">
          <Card className="p-5"><div className="flex items-center gap-2 mb-3"><Shield className="h-5 w-5 text-lnx-red-500" /><h3 className="font-semibold text-lnx-navy-800">Anti-Ragging Committee</h3></div>
            <div className="text-sm text-muted-foreground">Chair: Director · 5 members · Helpline: 1800-180-5522 · 100% undertaking compliance (140/140 students)</div>
          </Card>
          <Card className="p-0"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Incident</TableHead><TableHead>Action Taken</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{ragging.map(r => (<TableRow key={r.id}><TableCell className="text-xs">{fmtDate(r.date)}</TableCell><TableCell>{r.description}</TableCell><TableCell className="text-xs">{r.action}</TableCell><TableCell><Badge variant={r.status==="Closed"?"secondary":"outline"}>{r.status}</Badge></TableCell></TableRow>))}</TableBody></Table></Card>
        </TabsContent>

        <TabsContent value="icc" className="mt-4">
          <Card className="p-5"><div className="flex items-center gap-2 mb-3"><Lock className="h-5 w-5 text-lnx-navy-800" /><h3 className="font-semibold text-lnx-navy-800">Internal Complaints Committee (POSH)</h3><Badge variant="outline">Restricted</Badge></div>
            <p className="text-sm text-muted-foreground mb-4">Confidential complaints register. Visibility limited to Presiding Officer and external member.</p>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span>Presiding Officer</span><span className="font-medium">Dr. Priya Deshmukh</span></div>
              <div className="flex justify-between"><span>External Member</span><span className="font-medium">Adv. Meera Joshi</span></div>
              <div className="flex justify-between"><span>Open cases</span><span className="font-medium">1</span></div>
              <div className="flex justify-between"><span>Closed (YTD)</span><span className="font-medium">2</span></div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="mt-4 space-y-4">
          {surveys.map(s => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div><div className="flex items-center gap-2"><Badge variant="outline" className="capitalize">{s.type}</Badge><Badge variant={s.status==="active"?"secondary":"outline"} className={s.status==="active"?"bg-lnx-green-500/10 text-lnx-green-500":""}>{s.status}</Badge></div>
                  <h3 className="font-semibold text-lnx-navy-800 mt-2">{s.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Launched {fmtDate(s.launched)}</p>
                </div>
                <div className="text-right"><div className="flex items-center gap-1 text-lnx-amber-500"><Star className="h-4 w-4 fill-current" /><span className="font-semibold tabular">{s.avgScore.toFixed(1)}</span><span className="text-xs text-muted-foreground">/5</span></div></div>
              </div>
              <div className="flex items-center justify-between text-xs mb-1"><span className="text-muted-foreground">Responses</span><span className="tabular font-medium">{s.responses}/{s.target}</span></div>
              <Progress value={(s.responses/s.target)*100} className="h-2" />
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={!!assignTarget} onOpenChange={o=>!o&&setAssignTarget(null)}>
        <DialogContent><DialogHeader><DialogTitle>Assign Owner</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2"><Label>Owner</Label><Input value={assignOwner} onChange={e=>setAssignOwner(e.target.value)} placeholder="e.g., HOD CSE, Registrar…" /></div>
          <DialogFooter><Button variant="outline" onClick={()=>setAssignTarget(null)}>Cancel</Button><Button onClick={doAssign}>Assign</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resolveTarget} onOpenChange={o=>!o&&setResolveTarget(null)}>
        <DialogContent><DialogHeader><DialogTitle>Resolve Grievance</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2"><Label>Resolution note</Label><Textarea value={resolveNote} onChange={e=>setResolveNote(e.target.value)} rows={4} placeholder="Action taken, communication to raiser…" /></div>
          <DialogFooter><Button variant="outline" onClick={()=>setResolveTarget(null)}>Cancel</Button><Button onClick={doResolve}>Resolve & Notify</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={launchOpen} onOpenChange={setLaunchOpen}>
        <DialogContent><DialogHeader><DialogTitle>Launch Feedback Survey</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Survey name</Label><Input value={ls.name} onChange={e=>setLs({...ls, name:e.target.value})} placeholder="e.g., Mid-sem feedback for AIML" /></div>
            <div><Label>Type</Label><Select value={ls.type} onValueChange={(v: any)=>setLs({...ls, type:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="satisfaction">Student Satisfaction</SelectItem><SelectItem value="course">Course / Teacher</SelectItem><SelectItem value="exit">Exit (Final Year)</SelectItem><SelectItem value="parent">Parent</SelectItem><SelectItem value="alumni">Alumni</SelectItem>
            </SelectContent></Select></div>
            <div><Label>Target respondents</Label><Input type="number" value={ls.target} onChange={e=>setLs({...ls, target:+e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setLaunchOpen(false)}>Cancel</Button><Button onClick={launchSurvey}><Send className="h-4 w-4 mr-2" />Launch</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
