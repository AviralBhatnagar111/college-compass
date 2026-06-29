import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { KpiCard } from "@/components/common/KpiCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useAcademicStore, useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { PdfPreviewDialog } from "@/components/dashboard/ActionQueue";
import { ShieldCheck, AlertTriangle, CheckCircle2, FileText, Download, Target, BookOpen, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/compliance/nba")({
  head: () => ({ meta: [{ title: "NBA Cockpit — LearnNowX" }] }),
  component: NbaPage,
});

// NBA criteria (Tier-II UG Engineering)
const CRITERIA = [
  { id: 1, name: "Vision, Mission & PEOs", weight: 60, readiness: 92, status: "green" as const, gaps: [] },
  { id: 2, name: "Program Curriculum & Teaching-Learning Processes", weight: 120, readiness: 78, status: "amber" as const, gaps: ["2 new electives missing rubric"] },
  { id: 3, name: "Course Outcomes & Program Outcomes", weight: 120, readiness: 71, status: "amber" as const, gaps: ["CO attainment evidence for 4 subjects pending"] },
  { id: 4, name: "Students' Performance", weight: 150, readiness: 84, status: "green" as const, gaps: [] },
  { id: 5, name: "Faculty Information & Contributions", weight: 200, readiness: 66, status: "amber" as const, gaps: ["14 faculty CV/publication uploads pending"] },
  { id: 6, name: "Facilities & Technical Support", weight: 80, readiness: 88, status: "green" as const, gaps: [] },
  { id: 7, name: "Continuous Improvement", weight: 75, readiness: 58, status: "red" as const, gaps: ["PDCA loop documentation pending", "Action-Taken-Report not finalized"] },
  { id: 8, name: "First Year Academics", weight: 50, readiness: 80, status: "green" as const, gaps: [] },
  { id: 9, name: "Student Support Systems", weight: 50, readiness: 76, status: "amber" as const, gaps: ["Mentor-mentee logs partial"] },
  { id: 10, name: "Governance, Institutional Support & Financial Resources", weight: 95, readiness: 90, status: "green" as const, gaps: [] },
];

// CO-PO mapping rows
const COPO = [
  { subject: "CS301 — DBMS", co: "CO1: Design ER models", po1: 3, po2: 2, po3: 3, po4: 1, po5: 2, attainment: 78 },
  { subject: "CS301 — DBMS", co: "CO2: Normalize relations", po1: 2, po2: 3, po3: 3, po4: 2, po5: 1, attainment: 82 },
  { subject: "CS302 — OS", co: "CO1: Process scheduling", po1: 3, po2: 3, po3: 2, po4: 2, po5: 2, attainment: 74 },
  { subject: "CS302 — OS", co: "CO2: Memory management", po1: 3, po2: 2, po3: 3, po4: 1, po5: 1, attainment: 71 },
  { subject: "CS303 — AI/ML", co: "CO1: Apply ML algorithms", po1: 2, po2: 3, po3: 3, po4: 3, po5: 3, attainment: 65 },
  { subject: "CS304 — CN", co: "CO1: OSI layer protocols", po1: 3, po2: 2, po3: 2, po4: 1, po5: 1, attainment: 80 },
  { subject: "CS305 — SE", co: "CO1: SDLC application", po1: 2, po2: 2, po3: 3, po4: 2, po5: 3, attainment: 76 },
];

const PROGRAMS = [
  { id: "P_CSE", name: "B.Tech CSE", saa: 86, accStatus: "Accredited", validTill: "Jun 2027", visit: "Jan 2024" },
  { id: "P_ECE", name: "B.Tech ECE", saa: 78, accStatus: "Accredited", validTill: "Jun 2026", visit: "Mar 2023" },
  { id: "P_ME",  name: "B.Tech ME",  saa: 72, accStatus: "Provisional", validTill: "Dec 2025", visit: "Sep 2023" },
  { id: "P_CIVIL", name: "B.Tech CIVIL", saa: 68, accStatus: "Provisional", validTill: "Dec 2025", visit: "Sep 2023" },
  { id: "P_BIOTECH", name: "B.Tech BIOTECH", saa: 0, accStatus: "Not Applied", validTill: "—", visit: "—" },
];

const statusColor = (s: "green" | "amber" | "red") =>
  s === "green" ? "bg-lnx-green-500/10 text-lnx-green-500 border-lnx-green-500/30" :
  s === "amber" ? "bg-lnx-amber-500/10 text-lnx-amber-500 border-lnx-amber-500/30" :
                  "bg-lnx-red-500/10 text-lnx-red-500 border-lnx-red-500/30";

function NbaPage() {
  const subjects = useAcademicStore(s => s.subjects);
  const addAudit = useAccessStore(s => s.addAudit);
  const { user } = useAccess();
  const [open, setOpen] = useState<number | null>(null);
  const [sarOpen, setSarOpen] = useState(false);

  const totalWeight = CRITERIA.reduce((s,c)=>s+c.weight, 0);
  const weighted = Math.round(CRITERIA.reduce((s,c)=>s + c.weight * c.readiness, 0) / totalWeight);
  const score = Math.round(weighted * 10); // out of 1000

  const audit = (a: string, r?: string) => addAudit({ id: `a_${Date.now()}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hoi", module: "NBA", action: a, reason: r });

  const runAssess = () => { audit("Ran NBA self-assessment", `Score ${score}/1000`); toast.success("NBA Self-Assessment Complete", { description: `${weighted}% weighted readiness · projected ${score}/1000` }); };
  const exportCopo = () => { audit("Exported CO-PO matrix"); toast.success("CO-PO matrix exported (CSV)"); };

  const focused = open ? CRITERIA.find(c => c.id === open) : null;

  return (
    <div>
      <PageHeader title="NBA Accreditation Cockpit" subtitle="National Board of Accreditation · Tier-II UG Engineering · 10 Criteria, 1000-point scale"
        action={<div className="flex gap-2"><Button variant="outline" onClick={()=>setSarOpen(true)}><Download className="h-4 w-4 mr-2" />SAR Draft</Button><Button onClick={runAssess}><ShieldCheck className="h-4 w-4 mr-2" />Run Self-Assessment</Button></div>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Projected Score" value={`${score}/1000`} icon={Target} tone="teal" />
        <KpiCard label="Weighted Readiness" value={`${weighted}%`} icon={ShieldCheck} tone={weighted >= 75 ? "green" : weighted >= 60 ? "amber" : "red"} />
        <KpiCard label="Programs Accredited" value="2 / 5" icon={CheckCircle2} tone="green" />
        <KpiCard label="Critical Gaps" value={CRITERIA.filter(c => c.status === "red").length} icon={AlertTriangle} tone="red" />
      </div>

      <Tabs defaultValue="criteria">
        <TabsList>
          <TabsTrigger value="criteria">10 Criteria</TabsTrigger>
          <TabsTrigger value="copo">CO-PO Attainment</TabsTrigger>
          <TabsTrigger value="programs">Program Status</TabsTrigger>
          <TabsTrigger value="evidence">Evidence Vault</TabsTrigger>
        </TabsList>

        <TabsContent value="criteria" className="space-y-3 mt-4">
          {CRITERIA.map(c => (
            <Card key={c.id} className={cn("p-4 border-l-4", c.status === "green" ? "border-l-lnx-green-500" : c.status === "amber" ? "border-l-lnx-amber-500" : "border-l-lnx-red-500")}>
              <button className="w-full text-left" onClick={()=>setOpen(c.id)}>
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-full bg-accent grid place-items-center font-bold text-sm text-lnx-navy-800">{c.id}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><h3 className="font-semibold text-lnx-navy-800 truncate">{c.name}</h3><Badge variant="outline" className="text-[10px]">Weight {c.weight}</Badge></div>
                    <div className="mt-2 flex items-center gap-3"><Progress value={c.readiness} className="h-1.5 max-w-md" /><span className="text-sm font-semibold tabular">{c.readiness}%</span><span className="text-xs text-muted-foreground">→ contributes {Math.round(c.weight * c.readiness / 100)} pts</span></div>
                  </div>
                  <Badge className={statusColor(c.status)}>{c.status.toUpperCase()}</Badge>
                </div>
              </button>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="copo" className="mt-4">
          <Card>
            <div className="flex items-center justify-between border-b p-4">
              <div><h3 className="font-semibold text-lnx-navy-800">Course Outcome → Program Outcome Matrix</h3><p className="text-xs text-muted-foreground mt-0.5">Sem 5 · CSE · Bloom-level mapping (1 = slight, 3 = strong)</p></div>
              <Button variant="outline" size="sm" onClick={exportCopo}><Download className="h-3 w-3 mr-1" />Export CSV</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-accent/40 text-muted-foreground"><tr>
                  <th className="text-left p-2 pl-4">Subject</th><th className="text-left p-2">CO</th>
                  <th className="p-2">PO1</th><th className="p-2">PO2</th><th className="p-2">PO3</th><th className="p-2">PO4</th><th className="p-2">PO5</th>
                  <th className="p-2 pr-4 text-right">Attainment</th>
                </tr></thead>
                <tbody>
                  {COPO.map((r, i) => (
                    <tr key={i} className="border-t hover:bg-accent/30">
                      <td className="p-2 pl-4 font-medium">{r.subject}</td>
                      <td className="p-2 text-muted-foreground">{r.co}</td>
                      {[r.po1,r.po2,r.po3,r.po4,r.po5].map((v, idx) => (
                        <td key={idx} className="p-2 text-center"><span className={cn("inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold",
                          v === 3 ? "bg-lnx-teal-500 text-white" : v === 2 ? "bg-lnx-teal-500/30 text-lnx-teal-500" : "bg-muted text-muted-foreground")}>{v}</span></td>
                      ))}
                      <td className="p-2 pr-4 text-right">
                        <span className={cn("font-semibold tabular", r.attainment >= 75 ? "text-lnx-green-500" : r.attainment >= 60 ? "text-lnx-amber-500" : "text-lnx-red-500")}>{r.attainment}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t px-4 py-3 text-xs text-muted-foreground flex justify-between"><span>{COPO.length} COs across {new Set(COPO.map(r=>r.subject)).size} subjects · target ≥ 70%</span><span>NBA threshold: 60% direct + 40% indirect attainment</span></div>
          </Card>
        </TabsContent>

        <TabsContent value="programs" className="mt-4">
          <Card>
            <table className="w-full text-sm">
              <thead className="bg-accent/40 text-xs uppercase text-muted-foreground"><tr>
                <th className="text-left p-3 pl-4">Program</th><th className="text-left p-3">Status</th><th className="text-left p-3">SAR Readiness</th><th className="text-left p-3">Valid Till</th><th className="text-left p-3">Last Visit</th><th></th>
              </tr></thead>
              <tbody>
                {PROGRAMS.map(p => (
                  <tr key={p.id} className="border-t hover:bg-accent/30">
                    <td className="p-3 pl-4 font-medium">{p.name}</td>
                    <td className="p-3"><Badge variant="outline" className={p.accStatus === "Accredited" ? "border-lnx-green-500/40 text-lnx-green-500" : p.accStatus === "Provisional" ? "border-lnx-amber-500/40 text-lnx-amber-500" : "text-muted-foreground"}>{p.accStatus}</Badge></td>
                    <td className="p-3"><div className="flex items-center gap-2 max-w-xs"><Progress value={p.saa} className="h-1.5" /><span className="text-xs tabular font-semibold w-10">{p.saa}%</span></div></td>
                    <td className="p-3 text-muted-foreground">{p.validTill}</td>
                    <td className="p-3 text-muted-foreground">{p.visit}</td>
                    <td className="p-3 text-right pr-4"><Button variant="ghost" size="sm" onClick={()=>toast.info(`${p.name} SAR opens here in production`)}>Open SAR</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="evidence" className="mt-4">
          <div className="grid md:grid-cols-3 gap-3">
            {[
              { name: "Faculty CV repository", count: `${22}/${26}`, icon: BookOpen, ok: false },
              { name: "Lab manuals & rubrics", count: `${18}/${18}`, icon: FlaskConical, ok: true },
              { name: "Internal exam papers", count: `${48}/${48}`, icon: FileText, ok: true },
              { name: "Student feedback (MFRs)", count: `${91}%`, icon: ShieldCheck, ok: true },
              { name: "Publication records", count: `${42}`, icon: BookOpen, ok: true },
              { name: "PDCA documents", count: `${4}/${10}`, icon: AlertTriangle, ok: false },
            ].map((e, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between mb-2"><e.icon className={cn("h-4 w-4", e.ok ? "text-lnx-green-500" : "text-lnx-amber-500")} /><Badge variant="outline" className="text-[10px]">{e.count}</Badge></div>
                <p className="text-sm font-medium">{e.name}</p>
                <Button variant="ghost" size="sm" className="mt-2 -ml-2" onClick={()=>toast.info(`Opens evidence drawer for ${e.name}`)}>View evidence →</Button>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={open !== null} onOpenChange={v => !v && setOpen(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {focused && (
            <>
              <SheetHeader><SheetTitle>Criterion {focused.id} — {focused.name}</SheetTitle>
                <SheetDescription>Weight {focused.weight} pts · {focused.readiness}% readiness ({Math.round(focused.weight * focused.readiness / 100)}/{focused.weight} pts)</SheetDescription>
              </SheetHeader>
              <div className="py-4 space-y-4">
                <Progress value={focused.readiness} className="h-2" />
                <div>
                  <h4 className="text-xs uppercase text-muted-foreground tracking-wide mb-2">Identified Gaps</h4>
                  {focused.gaps.length === 0 ? <p className="text-sm text-lnx-green-500 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" />No open gaps</p>
                    : <ul className="space-y-2">{focused.gaps.map((g,i) => <li key={i} className="text-sm flex items-start gap-2 rounded border bg-lnx-amber-500/5 p-3"><AlertTriangle className="h-4 w-4 text-lnx-amber-500 shrink-0 mt-0.5" />{g}</li>)}</ul>}
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={()=>{ audit(`Assigned action for Criterion ${focused.id}`); toast.success("Action assigned to coordinator"); setOpen(null); }}>Assign Action</Button>
                  <Button variant="outline" onClick={()=>toast.info("Evidence vault filtered")}>View Evidence</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <PdfPreviewDialog open={sarOpen} onOpenChange={setSarOpen}
        title="NBA SAR Draft" docType="Self-Assessment Report" recipient="National Board of Accreditation"
        fields={[
          { label: "Projected Score", value: `${score}/1000` },
          { label: "Weighted Readiness", value: `${weighted}%` },
          { label: "Programs covered", value: `${PROGRAMS.filter(p=>p.saa>0).length}` },
          { label: "Tier", value: "Tier-II UG Engineering" },
        ]}
        confirmLabel="Generate SAR Draft"
        onConfirm={() => audit("Generated NBA SAR Draft", `${PROGRAMS.filter(p=>p.saa>0).length} programs`)}
      />
      <div className="sr-only" aria-hidden>{subjects.length}</div>
    </div>
  );
}
