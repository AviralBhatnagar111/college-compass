// Three drill-down Sheets for HOI dashboard: Department, Funnel Stage, NAAC Criterion.
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export interface DeptRow {
  code: string; att: number; plc: number; health: "green" | "amber" | "red";
  faculty?: number; students?: number; passPct?: number; capstone?: number;
}
export function DepartmentDrawer({ open, onOpenChange, dept }: {
  open: boolean; onOpenChange: (v: boolean) => void; dept: DeptRow | null;
}) {
  if (!dept) return null;
  const facN = dept.faculty ?? { CSE: 8, ECE: 6, ME: 5, CIVIL: 4, BIOTECH: 3 }[dept.code as any] ?? 5;
  const stuN = dept.students ?? { CSE: 42, ECE: 34, ME: 28, CIVIL: 22, BIOTECH: 14 }[dept.code as any] ?? 25;
  const pass = dept.passPct ?? { CSE: 92, ECE: 88, ME: 72, CIVIL: 84, BIOTECH: 78 }[dept.code as any] ?? 80;
  const cap = dept.capstone ?? { CSE: 12, ECE: 9, ME: 6, CIVIL: 5, BIOTECH: 3 }[dept.code as any] ?? 6;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {dept.code} Department
            <Badge variant="outline" className={dept.health === "green" ? "border-lnx-green-500/40 text-lnx-green-500" : dept.health === "amber" ? "border-lnx-amber-500/40 text-lnx-amber-500" : "border-lnx-red-500/40 text-lnx-red-500"}>
              {dept.health === "green" ? "Healthy" : dept.health === "amber" ? "Watch" : "At Risk"}
            </Badge>
          </SheetTitle>
          <SheetDescription>Snapshot of key performance indicators.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3"><p className="text-[10px] uppercase text-muted-foreground">Faculty</p><p className="text-xl font-semibold tabular">{facN}</p></div>
            <div className="rounded-lg border p-3"><p className="text-[10px] uppercase text-muted-foreground">Students</p><p className="text-xl font-semibold tabular">{stuN}</p></div>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs"><span>Attendance</span><span className="tabular font-medium">{dept.att}%</span></div>
              <Progress value={dept.att} className="mt-1 h-1.5" />
            </div>
            <div>
              <div className="flex justify-between text-xs"><span>Placement</span><span className="tabular font-medium">{dept.plc}%</span></div>
              <Progress value={dept.plc} className="mt-1 h-1.5" />
            </div>
            <div>
              <div className="flex justify-between text-xs"><span>Pass %</span><span className="tabular font-medium">{pass}%</span></div>
              <Progress value={pass} className="mt-1 h-1.5" />
            </div>
            <div className="flex justify-between rounded border-t pt-2 text-xs"><span className="text-muted-foreground">Capstone projects</span><span className="tabular font-medium">{cap}</span></div>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild size="sm" variant="outline"><Link to="/people/faculty">View faculty roster<ArrowRight className="ml-auto h-3.5 w-3.5" /></Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/academic/attendance">Attendance monitor<ArrowRight className="ml-auto h-3.5 w-3.5" /></Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/academic/results">Results & CO-PO<ArrowRight className="ml-auto h-3.5 w-3.5" /></Link></Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export interface FunnelStage { label: string; count: number; conv: number; stage: string }
const DROP_OFF: Record<string, { reason: string; pct: number }[]> = {
  inquired: [{ reason: "Did not respond to follow-up", pct: 22 }, { reason: "Chose competing institute", pct: 8 }, { reason: "Financial constraints", pct: 6 }],
  counselled: [{ reason: "Program not aligned", pct: 5 }, { reason: "Fee affordability", pct: 4 }],
  applied: [{ reason: "Incomplete documents", pct: 12 }, { reason: "Did not appear for entrance", pct: 6 }],
  documents: [{ reason: "Certificate re-issue pending", pct: 8 }, { reason: "APAAR ID missing", pct: 5 }],
  approved: [{ reason: "Fee payment delayed", pct: 10 }, { reason: "Migration certificate pending", pct: 6 }],
  enrolled: [],
};
export function FunnelStageDrawer({ open, onOpenChange, stage }: {
  open: boolean; onOpenChange: (v: boolean) => void; stage: FunnelStage | null;
}) {
  if (!stage) return null;
  const reasons = DROP_OFF[stage.stage] ?? [];
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{stage.label} cohort</SheetTitle>
          <SheetDescription>{stage.count} prospects at this stage · {stage.conv}% conversion from top of funnel</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Cohort size</p>
            <p className="text-2xl font-semibold tabular">{stage.count}</p>
            <Progress value={stage.conv} className="mt-2 h-1.5" />
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top drop-off reasons</h4>
            {reasons.length === 0 ? (
              <p className="text-xs text-muted-foreground">Terminal stage — no further drop-off.</p>
            ) : (
              <ul className="space-y-2">
                {reasons.map(r => (
                  <li key={r.reason} className="rounded border p-2">
                    <div className="flex justify-between text-xs"><span>{r.reason}</span><span className="tabular font-medium text-lnx-red-500">{r.pct}%</span></div>
                    <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-lnx-red-500" style={{ width: `${r.pct * 3}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button asChild size="sm" variant="outline" className="w-full"><Link to="/admissions">Open Admissions module<ArrowRight className="ml-auto h-3.5 w-3.5" /></Link></Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export interface NaacCrit { id: string; number: number | string; name?: string; readiness: number; status: string }
const CRIT_DETAIL: Record<string, { key: string; label: string; readiness: number }[]> = {
  "1": [{ key: "1.1", label: "Curricular Planning", readiness: 82 }, { key: "1.2", label: "Academic Flexibility", readiness: 74 }, { key: "1.3", label: "Curriculum Enrichment", readiness: 68 }],
  "2": [{ key: "2.1", label: "Enrollment & Profile", readiness: 88 }, { key: "2.2", label: "Catering to Diverse Needs", readiness: 76 }, { key: "2.3", label: "Teaching-Learning Process", readiness: 82 }, { key: "2.6", label: "Student Outcomes", readiness: 78 }],
  "3": [{ key: "3.1", label: "Resource Mobilisation", readiness: 38 }, { key: "3.2", label: "Innovation Ecosystem", readiness: 42 }, { key: "3.3", label: "Research Publications", readiness: 40 }, { key: "3.4", label: "Extension Activities", readiness: 48 }],
  "4": [{ key: "4.1", label: "Physical Facilities", readiness: 78 }, { key: "4.2", label: "Library as a Resource", readiness: 72 }, { key: "4.3", label: "IT Infrastructure", readiness: 84 }],
  "5": [{ key: "5.1", label: "Student Support", readiness: 76 }, { key: "5.2", label: "Progression", readiness: 80 }, { key: "5.3", label: "Student Participation", readiness: 68 }],
  "6": [{ key: "6.1", label: "Governance", readiness: 74 }, { key: "6.2", label: "Strategy & Planning", readiness: 70 }, { key: "6.3", label: "Faculty Empowerment", readiness: 66 }],
  "7": [{ key: "7.1", label: "Institutional Values", readiness: 72 }, { key: "7.2", label: "Best Practices", readiness: 74 }, { key: "7.3", label: "Institutional Distinctiveness", readiness: 76 }],
};
export function NaacCriterionDrawer({ open, onOpenChange, crit }: {
  open: boolean; onOpenChange: (v: boolean) => void; crit: NaacCrit | null;
}) {
  if (!crit) return null;
  const rows = CRIT_DETAIL[String(crit.number)] ?? [];
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Criterion {crit.number}{crit.name ? ` — ${crit.name}` : ""}</SheetTitle>
          <SheetDescription>Sub-criteria readiness breakdown</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Overall readiness</span>
              <span className={`text-2xl font-semibold tabular ${crit.readiness >= 80 ? "text-lnx-green-500" : crit.readiness >= 60 ? "text-lnx-amber-500" : "text-lnx-red-500"}`}>{crit.readiness}%</span>
            </div>
            <Progress value={crit.readiness} className="mt-2 h-1.5" />
          </div>
          <div className="space-y-2">
            {rows.map(r => (
              <div key={r.key} className="rounded border p-2">
                <div className="flex justify-between text-xs"><span><strong>{r.key}</strong> {r.label}</span>
                  <span className={`tabular font-medium ${r.readiness >= 80 ? "text-lnx-green-500" : r.readiness >= 60 ? "text-lnx-amber-500" : "text-lnx-red-500"}`}>{r.readiness}%</span>
                </div>
                <Progress value={r.readiness} className="mt-1 h-1" />
              </div>
            ))}
          </div>
          <Button asChild size="sm" variant="outline" className="w-full"><Link to="/compliance/naac">Open NAAC cockpit<ArrowRight className="ml-auto h-3.5 w-3.5" /></Link></Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
