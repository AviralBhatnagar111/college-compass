import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { KpiCard } from "@/components/common/KpiCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { PdfPreviewDialog } from "@/components/dashboard/ActionQueue";
import { Trophy, TrendingUp, TrendingDown, BarChart3, Download, FileText, GraduationCap, FlaskConical, Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/compliance/nirf")({
  head: () => ({ meta: [{ title: "NIRF Cockpit — LearnNowX" }] }),
  component: NirfPage,
});

// NIRF Engineering category — official parameter weights (sum = 100)
const PARAMS = [
  { id: "TLR", name: "Teaching, Learning & Resources", weight: 30, score: 58.4, prevScore: 54.2, icon: GraduationCap,
    sub: [
      { label: "Student Strength incl. PhDs (SS)", weight: 20, score: 12.8 },
      { label: "Faculty-Student Ratio (FSR)", weight: 30, score: 19.2 },
      { label: "Faculty with PhD & Experience (FQE)", weight: 20, score: 11.6 },
      { label: "Financial Resources (FRU)", weight: 30, score: 14.8 },
    ] },
  { id: "RPC", name: "Research & Professional Practice", weight: 30, score: 42.1, prevScore: 38.6, icon: FlaskConical,
    sub: [
      { label: "Publications (PU)", weight: 35, score: 16.4 },
      { label: "Quality of Publications (QP)", weight: 40, score: 14.8 },
      { label: "IPR & Patents (IPR)", weight: 15, score: 6.2 },
      { label: "Footprint of Projects & Consultancy (FPPP)", weight: 10, score: 4.7 },
    ] },
  { id: "GO", name: "Graduation Outcomes", weight: 20, score: 71.8, prevScore: 68.9, icon: Trophy,
    sub: [
      { label: "Combined Performance (GPH/GUE)", weight: 60, score: 44.2 },
      { label: "Median Salary (GMS)", weight: 25, score: 18.1 },
      { label: "PhD Students Graduated (GPHD)", weight: 15, score: 9.5 },
    ] },
  { id: "OI", name: "Outreach & Inclusivity", weight: 10, score: 64.5, prevScore: 61.2, icon: Building2,
    sub: [
      { label: "Other States/Countries Students (RD)", weight: 30, score: 18.1 },
      { label: "Women Diversity (WD)", weight: 30, score: 22.4 },
      { label: "Economically/Socially Challenged (ESCS)", weight: 20, score: 12.6 },
      { label: "Differently-Abled Facilities (PCS)", weight: 20, score: 11.4 },
    ] },
  { id: "PR", name: "Perception", weight: 10, score: 38.2, prevScore: 35.1, icon: Users,
    sub: [
      { label: "Peer Perception: Academic & Employer (PR)", weight: 100, score: 38.2 },
    ] },
];

const RANK_HISTORY = [
  { year: "2022", band: "151-200", overall: 38.1 },
  { year: "2023", band: "151-200", overall: 41.6 },
  { year: "2024", band: "101-150", overall: 47.2 },
  { year: "2025", band: "101-150", overall: 52.8 },
  { year: "2026", band: "Projected 101-150", overall: 55.4 },
];

const DATA_SOURCES = [
  { name: "Faculty data (count, PhD, experience)", source: "HR / Faculty module", ok: true, value: "26/30 faculty · 18 PhD" },
  { name: "Student enrolment & PhD scholars", source: "Student SIS", ok: true, value: "140 UG · 0 PhD" },
  { name: "Publications (Scopus/Web of Science)", source: "Manual upload", ok: false, value: "42 papers (last 3 yrs)" },
  { name: "Patents granted/filed", source: "Research module", ok: true, value: "4 granted · 7 filed" },
  { name: "Median salary placements", source: "Placement module", ok: true, value: "₹4.8 LPA median" },
  { name: "Diversity (gender, region, ESCS)", source: "Admission module", ok: true, value: "32% women · 18% other states" },
];

function NirfPage() {
  const addAudit = useAccessStore(s => s.addAudit);
  const { user } = useAccess();
  const [dataOpen, setDataOpen] = useState(false);

  const overall = useMemo(() => +(PARAMS.reduce((s,p)=>s + p.score * p.weight, 0) / 100).toFixed(2), []);
  const delta = +(overall - RANK_HISTORY[RANK_HISTORY.length - 2].overall).toFixed(2);

  const audit = (a: string, r?: string) => addAudit({ id: `a_${Date.now()}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hoi", module: "NIRF", action: a, reason: r });

  const submit = () => { audit("Generated NIRF Data Capture File", `Score ${overall}`); toast.success("NIRF DCF generated", { description: `Overall ${overall} · YoY +${delta.toFixed(1)}` }); };

  return (
    <div>
      <PageHeader title="NIRF Cockpit" subtitle="National Institutional Ranking Framework · Engineering category · 5 parameter scoring"
        action={<div className="flex gap-2"><Button variant="outline" onClick={()=>setDataOpen(true)}><Download className="h-4 w-4 mr-2" />Generate DCF</Button><Button onClick={()=>{ audit("Recomputed NIRF score"); toast.success("Score recomputed from live data"); }}><BarChart3 className="h-4 w-4 mr-2" />Recompute Score</Button></div>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Projected Score 2026" value={overall.toFixed(2)} icon={Trophy} tone="teal" delta={{ value: `+${delta.toFixed(1)} YoY`, up: true }} />
        <KpiCard label="Projected Band" value="101-150" icon={TrendingUp} tone="green" />
        <KpiCard label="Last Rank Band" value="101-150" icon={BarChart3} />
        <KpiCard label="Strongest Pillar" value="Graduation" icon={Trophy} tone="green" />
      </div>

      <Tabs defaultValue="params">
        <TabsList>
          <TabsTrigger value="params">Parameter Scores</TabsTrigger>
          <TabsTrigger value="history">Trend (5 yr)</TabsTrigger>
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
          <TabsTrigger value="benchmarks">Peer Benchmarks</TabsTrigger>
        </TabsList>

        <TabsContent value="params" className="mt-4 space-y-3">
          {PARAMS.map(p => {
            const Icon = p.icon;
            const movement = p.score - p.prevScore;
            return (
              <Card key={p.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-accent p-2"><Icon className="h-5 w-5 text-lnx-navy-800" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2"><span className="text-xs font-mono text-muted-foreground">{p.id}</span><h3 className="font-semibold text-lnx-navy-800">{p.name}</h3><Badge variant="outline" className="text-[10px]">Weight {p.weight}%</Badge></div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-2xl font-bold tabular text-lnx-navy-800">{p.score.toFixed(1)}</span>
                        <span className={cn("text-xs flex items-center gap-0.5", movement >= 0 ? "text-lnx-green-500" : "text-lnx-red-500")}>
                          {movement >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{Math.abs(movement).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <Progress value={p.score} className="h-1.5 mt-2" />
                    <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                      {p.sub.map(s => (
                        <div key={s.label} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground truncate pr-2">{s.label}</span>
                          <span className="tabular font-medium">{s.score.toFixed(1)} <span className="text-muted-foreground">/ {s.weight}</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card className="p-5">
            <div className="flex items-end gap-4 h-48 mt-2">
              {RANK_HISTORY.map(h => {
                const isProjected = h.year.includes("Projected") || h.year === "2026";
                const height = (h.overall / 60) * 100;
                return (
                  <div key={h.year} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-semibold tabular">{h.overall.toFixed(1)}</span>
                    <div className={cn("w-full rounded-t transition-all", isProjected ? "bg-lnx-teal-500/40 border-2 border-dashed border-lnx-teal-500" : "bg-lnx-teal-500")} style={{ height: `${height}%` }} />
                    <span className="text-xs text-muted-foreground">{h.year.replace("Projected ","")}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">5-year overall score trend · solid bars are official, dashed is current projection from live data.</div>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="mt-4">
          <Card>
            <table className="w-full text-sm">
              <thead className="bg-accent/40 text-xs uppercase text-muted-foreground"><tr>
                <th className="text-left p-3 pl-4">Data Point</th><th className="text-left p-3">Source</th><th className="text-left p-3">Current Value</th><th className="text-left p-3">Status</th>
              </tr></thead>
              <tbody>
                {DATA_SOURCES.map((d, i) => (
                  <tr key={i} className="border-t hover:bg-accent/30">
                    <td className="p-3 pl-4 font-medium">{d.name}</td>
                    <td className="p-3 text-muted-foreground">{d.source}</td>
                    <td className="p-3 tabular">{d.value}</td>
                    <td className="p-3"><Badge variant="outline" className={d.ok ? "border-lnx-green-500/40 text-lnx-green-500" : "border-lnx-amber-500/40 text-lnx-amber-500"}>{d.ok ? "Live" : "Manual"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="benchmarks" className="mt-4">
          <Card>
            <div className="border-b p-4"><h3 className="font-semibold text-lnx-navy-800">Peer Benchmarks (similar tier)</h3><p className="text-xs text-muted-foreground mt-0.5">Engineering colleges in band 101-200 · Maharashtra</p></div>
            <table className="w-full text-sm">
              <thead className="bg-accent/40 text-xs uppercase text-muted-foreground"><tr>
                <th className="text-left p-3 pl-4">Institution</th><th className="text-left p-3">Band</th><th className="p-3 text-right">TLR</th><th className="p-3 text-right">RPC</th><th className="p-3 text-right">GO</th><th className="p-3 text-right pr-4">Overall</th>
              </tr></thead>
              <tbody>
                {[
                  { name: "Bharat Institute (us)", band: "101-150", tlr: 58.4, rpc: 42.1, go: 71.8, overall: overall.toFixed(2), us: true },
                  { name: "Pune Vidyapeeth Engg.", band: "101-150", tlr: 61.2, rpc: 45.6, go: 68.4, overall: "54.18" },
                  { name: "Maharashtra Tech College", band: "151-200", tlr: 52.8, rpc: 38.4, go: 65.1, overall: "48.92" },
                  { name: "Western India Engg.", band: "151-200", tlr: 49.6, rpc: 41.2, go: 63.8, overall: "47.45" },
                ].map(b => (
                  <tr key={b.name} className={cn("border-t hover:bg-accent/30", b.us && "bg-lnx-teal-500/5")}>
                    <td className="p-3 pl-4 font-medium">{b.name}{b.us && <Badge className="ml-2 text-[10px] bg-lnx-teal-500">YOU</Badge>}</td>
                    <td className="p-3 text-muted-foreground">{b.band}</td>
                    <td className="p-3 text-right tabular">{b.tlr.toFixed ? b.tlr.toFixed(1) : b.tlr}</td>
                    <td className="p-3 text-right tabular">{b.rpc.toFixed ? b.rpc.toFixed(1) : b.rpc}</td>
                    <td className="p-3 text-right tabular">{b.go.toFixed ? b.go.toFixed(1) : b.go}</td>
                    <td className="p-3 text-right pr-4 font-semibold tabular">{b.overall}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>

      <PdfPreviewDialog open={dataOpen} onOpenChange={setDataOpen}
        title="NIRF Data Capture File" docType="DCF · Engineering" recipient="MoE / NBA"
        fields={[
          { label: "Overall Score", value: overall.toFixed(2) },
          { label: "Projected Band", value: "101-150" },
          { label: "YoY Movement", value: `+${delta.toFixed(2)}` },
          { label: "Submission cycle", value: "NIRF 2026" },
        ]}
        confirmLabel="Submit DCF"
        onConfirm={submit}
      />
    </div>
  );
}
