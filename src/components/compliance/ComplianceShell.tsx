import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { KpiCard } from "@/components/common/KpiCard";
import { ShieldCheck, AlertTriangle, CheckCircle2, FileText, Download } from "lucide-react";

interface Props { framework: string; subtitle: string; pillars: string[]; }

export function ComplianceShell({ framework, subtitle, pillars }: Props) {
  const data = pillars.map((p, i) => ({
    name: p,
    readiness: 55 + ((i * 13) % 40),
    status: ((i * 13) % 40) > 25 ? "green" : ((i * 13) % 40) > 10 ? "amber" : "red",
  }));
  const avg = Math.round(data.reduce((s,d)=>s+d.readiness,0)/data.length);

  return (
    <div>
      <PageHeader title={`${framework}`} subtitle={subtitle}
        action={<div className="flex gap-2"><Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button><Button>Self-Assessment</Button></div>} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Overall Readiness" value={`${avg}%`} icon={ShieldCheck} tone="teal" />
        <KpiCard label="Green" value={data.filter(d=>d.status==="green").length} icon={CheckCircle2} tone="green" />
        <KpiCard label="Amber" value={data.filter(d=>d.status==="amber").length} icon={AlertTriangle} tone="amber" />
        <KpiCard label="Red" value={data.filter(d=>d.status==="red").length} icon={AlertTriangle} tone="red" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((d, i) => (
          <Card key={d.name} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Pillar {i+1}</p>
                <h3 className="font-semibold text-lnx-navy-800 mt-1">{d.name}</h3>
              </div>
              <Badge variant="secondary" className={d.status==="green"?"bg-lnx-green-500/10 text-lnx-green-500":d.status==="amber"?"bg-lnx-amber-500/10 text-lnx-amber-500":"bg-lnx-red-500/10 text-lnx-red-500"}>{d.status.toUpperCase()}</Badge>
            </div>
            <Progress value={d.readiness} className="h-1.5" />
            <div className="mt-2 flex items-center justify-between text-xs"><span className="text-muted-foreground">Readiness</span><span className="tabular font-semibold">{d.readiness}%</span></div>
            <Button variant="ghost" size="sm" className="mt-3"><FileText className="h-3 w-3 mr-1" />View Evidence</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
