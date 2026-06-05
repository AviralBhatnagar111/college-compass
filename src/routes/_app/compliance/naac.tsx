import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useComplianceStore, useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { ShieldCheck, AlertTriangle, CheckCircle2, FileText, Download, ChevronRight } from "lucide-react";
import { KpiCard } from "@/components/common/KpiCard";
import { cn } from "@/lib/utils";
import { PdfPreviewDialog } from "@/components/dashboard/ActionQueue";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/compliance/naac")({
  head: () => ({ meta: [{ title: "NAAC Cockpit — LearnNowX" }] }),
  component: NaacPage,
});

const statusStyle = {
  green: "border-l-lnx-green-500",
  amber: "border-l-lnx-amber-500",
  red: "border-l-lnx-red-500",
};

function NaacPage() {
  const criteria = useComplianceStore(s => s.criteria).filter(c => c.framework === "NAAC");
  const addAudit = useAccessStore(s => s.addAudit);
  const { user } = useAccess();
  const avg = Math.round(criteria.reduce((s,c)=>s+c.readiness,0)/criteria.length);
  const [openId, setOpenId] = useState<string | null>(criteria[0]?.id ?? null);
  const [ssrOpen, setSsrOpen] = useState(false);
  const [reportFor, setReportFor] = useState<string | null>(null);

  const reportCrit = criteria.find(c => c.id === reportFor);

  const runAssess = () => {
    addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hoi", module: "Quality", action: "Ran NAAC self-assessment", reason: `Overall readiness ${avg}%` });
    toast.success("Self-assessment complete", { description: `${avg}% overall readiness` });
  };

  return (
    <div>
      <PageHeader title="NAAC Cockpit" subtitle="7-criterion readiness with live evidence wiring"
        action={<div className="flex gap-2"><Button variant="outline" onClick={() => setSsrOpen(true)}><Download className="h-4 w-4 mr-2" />SSR Draft</Button><Button onClick={runAssess}>Run Self-Assessment</Button></div>} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Overall Readiness" value={`${avg}%`} icon={ShieldCheck} tone="teal" />
        <KpiCard label="Green" value={criteria.filter(c=>c.status==="green").length} icon={CheckCircle2} tone="green" />
        <KpiCard label="Amber" value={criteria.filter(c=>c.status==="amber").length} icon={AlertTriangle} tone="amber" />
        <KpiCard label="Red" value={criteria.filter(c=>c.status==="red").length} icon={AlertTriangle} tone="red" />
      </div>
      <div className="space-y-3">
        {criteria.map(c => (
          <Card key={c.id} className={cn("border-l-4 transition", statusStyle[c.status])}>
            <button onClick={() => setOpenId(openId === c.id ? null : c.id)} className="w-full p-5 text-left">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-accent grid place-items-center font-bold text-lnx-navy-800">{c.number}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lnx-navy-800">{c.name}</h3>
                  <div className="mt-2 flex items-center gap-3">
                    <Progress value={c.readiness} className="h-1.5 max-w-xs" />
                    <span className="text-sm font-semibold tabular">{c.readiness}%</span>
                  </div>
                </div>
                <Badge variant="secondary" className={c.status==="green"?"bg-lnx-green-500/10 text-lnx-green-500":c.status==="amber"?"bg-lnx-amber-500/10 text-lnx-amber-500":"bg-lnx-red-500/10 text-lnx-red-500"}>{c.status.toUpperCase()}</Badge>
                <ChevronRight className={cn("h-5 w-5 text-muted-foreground transition", openId === c.id && "rotate-90")} />
              </div>
            </button>
            {openId === c.id && (
              <div className="border-t px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Data Sources</h4>
                  <div className="space-y-2">
                    {c.sources.map(src => (
                      <div key={src.name} className="flex items-center gap-2 text-sm">
                        {src.ok ? <CheckCircle2 className="h-4 w-4 text-lnx-green-500" /> : <AlertTriangle className="h-4 w-4 text-lnx-amber-500" />}
                        <span className={src.ok ? "" : "text-muted-foreground"}>{src.name}</span>
                        <Badge variant="outline" className="ml-auto text-[10px]">{src.ok ? "Connected" : "Pending"}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Identified Gaps</h4>
                  {c.gaps.length === 0
                    ? <p className="text-sm text-lnx-green-500 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" />No gaps detected</p>
                    : <ul className="space-y-1">{c.gaps.map(g => <li key={g} className="text-sm flex items-start gap-2"><span className="mt-1.5 h-1 w-1 rounded-full bg-lnx-amber-500" />{g}</li>)}</ul>}
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setReportFor(c.id)}><FileText className="h-3 w-3 mr-1" />Generate Criterion Report</Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <PdfPreviewDialog open={ssrOpen} onOpenChange={setSsrOpen} title="NAAC SSR Draft" docType="Self Study Report" recipient="Bharat Institute of Engineering"
        fields={[{ label: "Overall Readiness", value: `${avg}%` }, { label: "Criteria Green", value: String(criteria.filter(c=>c.status==="green").length) }, { label: "Cycle", value: "Cycle 3" }]}
        confirmLabel="Generate SSR Draft"
        onConfirm={() => { addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hoi", module: "Quality", action: "Generated NAAC SSR Draft" }); }}
      />
      <PdfPreviewDialog open={!!reportFor} onOpenChange={(v) => !v && setReportFor(null)}
        title="Criterion Report" docType={reportCrit ? `Criterion ${reportCrit.number}` : "Criterion"} recipient={reportCrit?.name ?? ""}
        fields={reportCrit ? [{ label: "Readiness", value: `${reportCrit.readiness}%` }, { label: "Status", value: reportCrit.status.toUpperCase() }, { label: "Open gaps", value: String(reportCrit.gaps.length) }] : []}
        confirmLabel="Generate Report"
        onConfirm={() => { if (reportCrit) addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hoi", module: "Quality", action: `Generated criterion ${reportCrit.number} report` }); }}
      />
    </div>
  );
}
