import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { KpiCard } from "@/components/common/KpiCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { ShieldCheck, FilePlus, FileText, Download, CheckCircle2, Clock, Plus, Target, Award, Lightbulb, FileCheck } from "lucide-react";

export const Route = createFileRoute("/_app/quality/iqac")({
  head: () => ({ meta: [{ title: "IQAC — LearnNowX" }] }),
  component: IqacPage,
});

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
const daysAhead = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString(); };

interface Meeting { id: string; date: string; agenda: string; attendees: string; minutes: string; actions: { text: string; owner: string; due: string; done: boolean }[]; }
interface Aqar { id: string; year: string; status: "draft" | "submitted"; updatedAt: string; criteria: number; }

function IqacPage() {
  const { user } = useAccess();
  const addAudit = useAccessStore(s => s.addAudit);
  const audit = (action: string, reason?: string) => addAudit({ id: `a_${Date.now()}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hoi", module: "IQAC", action, reason });

  const [meetings, setMeetings] = useState<Meeting[]>([
    { id: "M1", date: daysAgo(40), agenda: "Q2 review: NAAC AQAR progress, FDP plan, feedback action items", attendees: "Director, IQAC Coord, 6 HODs, External member", minutes: "Reviewed criterion-wise readiness. C3 publications gap flagged. Action items assigned.", actions: [
      { text: "Publish 10 SCI papers by Q4", owner: "HOD CSE", due: daysAhead(60), done: false },
      { text: "Update student feedback module", owner: "Registrar", due: daysAhead(15), done: true },
    ]},
    { id: "M2", date: daysAgo(110), agenda: "Annual review + AQAR 2024-25 finalization", attendees: "Full IQAC", minutes: "AQAR submitted on 22 Dec 2024.", actions: [{ text: "Submit AQAR 2024-25", owner: "Coordinator", due: daysAgo(80), done: true }] },
  ]);

  const [aqar] = useState<Aqar[]>([
    { id: "AQ1", year: "2024-25", status: "submitted", updatedAt: daysAgo(80), criteria: 7 },
    { id: "AQ2", year: "2025-26", status: "draft", updatedAt: daysAgo(10), criteria: 7 },
  ]);

  const [ssr] = useState([
    { criterion: "1. Curricular Aspects", completeness: 88 },
    { criterion: "2. Teaching-Learning & Evaluation", completeness: 74 },
    { criterion: "3. Research, Innovation & Extension", completeness: 58 },
    { criterion: "4. Infrastructure & Learning Resources", completeness: 91 },
    { criterion: "5. Student Support & Progression", completeness: 79 },
    { criterion: "6. Governance, Leadership & Management", completeness: 92 },
    { criterion: "7. Institutional Values & Best Practices", completeness: 49 },
  ]);

  const [audits] = useState([
    { id: "AA1", type: "Academic Audit", date: daysAgo(60), status: "Completed", findings: 8, resolved: 6 },
    { id: "AA2", type: "Administrative Audit", date: daysAgo(120), status: "Completed", findings: 5, resolved: 5 },
    { id: "AA3", type: "Green Audit", date: daysAhead(30), status: "Scheduled", findings: 0, resolved: 0 },
  ]);

  const [plan] = useState([
    { goal: "Achieve NAAC MBGL Level 4 by 2027", milestones: 6, done: 3 },
    { goal: "Increase research publications to 60/year", milestones: 4, done: 2 },
    { goal: "100% placement for eligible students by 2026", milestones: 5, done: 3 },
    { goal: "Launch 3 new PG programs by 2027-28", milestones: 4, done: 1 },
  ]);

  const [best] = useState([
    { title: "AI-driven Placement Readiness Program", impact: "100% MCQ practice coverage", year: "2024-25" },
    { title: "Mentor-Mentee 1:15 ratio with weekly check-ins", impact: "Dropout reduced from 4.2% to 1.8%", year: "2023-24" },
  ]);

  const [disclosures] = useState([
    { item: "Mandatory disclosure as per AICTE", status: true }, { item: "Annual Report 2024-25", status: true },
    { item: "IQAC composition & contact", status: true }, { item: "NIRF data submission", status: true },
    { item: "Anti-ragging policy & helpline", status: true }, { item: "Fee structure (all programs)", status: true },
    { item: "Grievance redressal mechanism", status: true }, { item: "Internal Complaints Committee", status: true },
    { item: "Audited financial statements", status: false }, { item: "Sexual Harassment policy", status: true },
  ]);

  // New meeting dialog
  const [openNew, setOpenNew] = useState(false);
  const [nm, setNm] = useState({ agenda: "", attendees: "", minutes: "" });
  const submitMeeting = () => {
    if (!nm.agenda) { toast.error("Agenda required"); return; }
    const m: Meeting = { id: `M_${Date.now()}`, date: new Date().toISOString(), agenda: nm.agenda, attendees: nm.attendees, minutes: nm.minutes, actions: [] };
    setMeetings([m, ...meetings]);
    audit("Logged IQAC meeting", nm.agenda);
    toast.success("Meeting recorded · cascaded to ATR & Calendar");
    setOpenNew(false); setNm({ agenda: "", attendees: "", minutes: "" });
  };

  const generateAqar = (year: string) => {
    audit(`Generated AQAR ${year}`, "Pulled live ERP data across 7 criteria");
    toast.success(`AQAR ${year} generated · ready to submit`);
  };

  const totalActions = meetings.reduce((a, m) => a + m.actions.length, 0);
  const doneActions = meetings.reduce((a, m) => a + m.actions.filter(x => x.done).length, 0);
  const ssrAvg = Math.round(ssr.reduce((a, s) => a + s.completeness, 0) / ssr.length);

  return (
    <div>
      <PageHeader title="IQAC — Internal Quality Assurance Cell" subtitle="Director's quality command center · NAAC AQAR · SSR · Best Practices"
        action={<Button onClick={() => setOpenNew(true)}><Plus className="h-4 w-4 mr-2" />New Meeting</Button>} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Quality Score" value={`${ssrAvg}%`} icon={ShieldCheck} tone="teal" />
        <KpiCard label="IQAC Meetings (YTD)" value={meetings.length} icon={FileText} />
        <KpiCard label="ATR Closed" value={`${doneActions}/${totalActions}`} icon={CheckCircle2} tone="green" />
        <KpiCard label="AQAR 2025-26" value="Draft" icon={Clock} tone="amber" />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="meetings">Meetings & ATR</TabsTrigger>
          <TabsTrigger value="aqar">AQAR</TabsTrigger>
          <TabsTrigger value="ssr">SSR</TabsTrigger>
          <TabsTrigger value="audit">AAA</TabsTrigger>
          <TabsTrigger value="plan">Strategic Plan</TabsTrigger>
          <TabsTrigger value="best">Best Practices</TabsTrigger>
          <TabsTrigger value="disclosures">Disclosures</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid md:grid-cols-2 gap-4">
          <Card className="p-5"><h3 className="font-semibold text-lnx-navy-800 mb-3">IQAC Composition</h3>
            <ul className="text-sm space-y-2">
              <li className="flex justify-between"><span>Chairperson</span><span className="font-medium">Dr. Rajeshwari Krishnan (Director)</span></li>
              <li className="flex justify-between"><span>Coordinator</span><span className="font-medium">Dr. Aarti Sharma (HOD CSE)</span></li>
              <li className="flex justify-between"><span>Internal Members</span><span className="font-medium">6 HODs + 2 senior faculty</span></li>
              <li className="flex justify-between"><span>External Members</span><span className="font-medium">2 (Industry + Academia)</span></li>
              <li className="flex justify-between"><span>Student Rep</span><span className="font-medium">1</span></li>
              <li className="flex justify-between"><span>Parent Rep</span><span className="font-medium">1</span></li>
            </ul>
          </Card>
          <Card className="p-5"><h3 className="font-semibold text-lnx-navy-800 mb-3">Upcoming Submissions</h3>
            <ul className="text-sm space-y-3">
              <li className="flex justify-between"><span>AQAR 2025-26</span><Badge variant="outline">Due 31 Dec 2026</Badge></li>
              <li className="flex justify-between"><span>NIRF 2026 data</span><Badge variant="outline">Due 15 Dec</Badge></li>
              <li className="flex justify-between"><span>AICTE EoA renewal</span><Badge variant="outline">Due Feb 2027</Badge></li>
              <li className="flex justify-between"><span>NAAC Re-accreditation</span><Badge>Cycle 3 · Mar 2028</Badge></li>
            </ul>
          </Card>
        </TabsContent>

        <TabsContent value="meetings" className="mt-4">
          <Card className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Agenda</TableHead><TableHead>Attendees</TableHead><TableHead>Action Items</TableHead></TableRow></TableHeader>
              <TableBody>{meetings.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs">{fmtDate(m.date)}</TableCell>
                  <TableCell className="max-w-md"><div className="text-sm font-medium">{m.agenda}</div><div className="text-xs text-muted-foreground mt-1">{m.minutes}</div></TableCell>
                  <TableCell className="text-xs">{m.attendees}</TableCell>
                  <TableCell><Badge variant="outline">{m.actions.filter(a=>a.done).length}/{m.actions.length} closed</Badge></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="aqar" className="mt-4 space-y-4">
          {aqar.map(a => (
            <Card key={a.id} className="p-5 flex items-center justify-between">
              <div><div className="font-semibold text-lnx-navy-800">AQAR {a.year}</div><div className="text-xs text-muted-foreground mt-1">{a.criteria} criteria · Last updated {fmtDate(a.updatedAt)}</div></div>
              <div className="flex items-center gap-3"><Badge variant={a.status==="submitted"?"secondary":"outline"} className={a.status==="submitted"?"bg-lnx-green-500/10 text-lnx-green-500":""}>{a.status}</Badge>
                <Button variant="outline" size="sm" onClick={() => generateAqar(a.year)}><FileCheck className="h-4 w-4 mr-2" />Generate</Button>
                <Button variant="ghost" size="sm" onClick={() => toast.success(`AQAR ${a.year} downloaded`)}><Download className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="ssr" className="mt-4 space-y-3">
          {ssr.map(s => (
            <Card key={s.criterion} className="p-4">
              <div className="flex items-center justify-between mb-2"><span className="font-medium text-sm">{s.criterion}</span><span className="text-sm tabular font-semibold">{s.completeness}%</span></div>
              <Progress value={s.completeness} className="h-2" />
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="audit" className="mt-4"><Card className="p-0">
          <Table><TableHeader><TableRow><TableHead>Audit</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Findings</TableHead><TableHead>Resolved</TableHead></TableRow></TableHeader>
            <TableBody>{audits.map(a => (<TableRow key={a.id}><TableCell className="font-medium">{a.type}</TableCell><TableCell className="text-xs">{fmtDate(a.date)}</TableCell><TableCell><Badge variant={a.status==="Completed"?"secondary":"outline"}>{a.status}</Badge></TableCell><TableCell className="tabular">{a.findings}</TableCell><TableCell className="tabular">{a.resolved}</TableCell></TableRow>))}</TableBody>
          </Table></Card>
        </TabsContent>

        <TabsContent value="plan" className="mt-4 space-y-3">
          {plan.map((g, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Target className="h-4 w-4 text-lnx-teal-500" /><span className="font-medium text-sm">{g.goal}</span></div><Badge variant="outline">{g.done}/{g.milestones} milestones</Badge></div>
              <Progress value={(g.done/g.milestones)*100} className="h-2" />
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="best" className="mt-4 grid md:grid-cols-2 gap-4">
          {best.map((b, i) => (
            <Card key={i} className="p-5"><div className="flex items-center gap-2 mb-2"><Award className="h-4 w-4 text-lnx-amber-500" /><span className="text-xs text-muted-foreground">{b.year}</span></div>
              <h3 className="font-semibold text-lnx-navy-800">{b.title}</h3><p className="text-sm text-muted-foreground mt-2"><Lightbulb className="h-3 w-3 inline mr-1" />{b.impact}</p>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="disclosures" className="mt-4"><Card className="p-0">
          <Table><TableHeader><TableRow><TableHead>Disclosure</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
            <TableBody>{disclosures.map((d, i) => (<TableRow key={i}><TableCell>{d.item}</TableCell><TableCell className="text-right"><Badge variant={d.status?"secondary":"outline"} className={d.status?"bg-lnx-green-500/10 text-lnx-green-500":"bg-lnx-amber-500/10 text-lnx-amber-500"}>{d.status?"Published":"Pending"}</Badge></TableCell></TableRow>))}</TableBody>
          </Table></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent><DialogHeader><DialogTitle>Log IQAC Meeting</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Agenda</Label><Input value={nm.agenda} onChange={e=>setNm({...nm, agenda:e.target.value})} placeholder="Quarterly review, AQAR progress…" /></div>
            <div><Label>Attendees</Label><Input value={nm.attendees} onChange={e=>setNm({...nm, attendees:e.target.value})} placeholder="Director, Coordinator, 6 HODs…" /></div>
            <div><Label>Minutes</Label><Textarea value={nm.minutes} onChange={e=>setNm({...nm, minutes:e.target.value})} rows={4} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setOpenNew(false)}>Cancel</Button><Button onClick={submitMeeting}>Log Meeting</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
