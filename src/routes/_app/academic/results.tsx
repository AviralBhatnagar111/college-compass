import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUsersStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { KpiCard } from "@/components/common/KpiCard";
import { Award, TrendingUp, AlertCircle, FileBarChart, Download, Lock, Target } from "lucide-react";
import { ConfirmDialog } from "@/components/dashboard/ActionQueue";
import { lockMarksCascade, publishResultsCascade } from "@/lib/cascade";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/academic/results")({
  head: () => ({ meta: [{ title: "Results — LearnNowX" }] }),
  component: ResultsPage,
});

// CO-PO Attainment matrix — Sem 5 CSE (DBMS). Values are attainment percentages.
const COURSE_OUTCOMES = [
  { id: "CO1", desc: "Apply ER modelling to design schemas" },
  { id: "CO2", desc: "Write complex SQL & relational algebra" },
  { id: "CO3", desc: "Normalize to 3NF/BCNF; reason about anomalies" },
  { id: "CO4", desc: "Analyze transactions & concurrency control" },
  { id: "CO5", desc: "Evaluate indexing & query-optimization strategies" },
];
const PROGRAM_OUTCOMES = ["PO1", "PO2", "PO3", "PO4", "PO5", "PSO1", "PSO2"] as const;
// Mapping strength 0–3 (NBA convention). 0 = none, 3 = strong.
const MAPPING: Record<string, number[]> = {
  CO1: [3, 2, 2, 1, 1, 3, 2],
  CO2: [3, 3, 2, 2, 1, 3, 3],
  CO3: [2, 3, 3, 2, 1, 3, 2],
  CO4: [2, 3, 3, 3, 2, 2, 3],
  CO5: [2, 3, 3, 3, 2, 2, 3],
};
// Direct (internal+external) and indirect (survey) attainment %
const ATTAINMENT: Record<string, { direct: number; indirect: number }> = {
  CO1: { direct: 78, indirect: 82 },
  CO2: { direct: 71, indirect: 76 },
  CO3: { direct: 64, indirect: 73 },
  CO4: { direct: 69, indirect: 74 },
  CO5: { direct: 73, indirect: 78 },
};
const TARGET = 70; // NBA Tier-II threshold

function ResultsPage() {
  const users = useUsersStore(s => s.users);
  const { user } = useAccess();
  const students = users.filter(u => u.role === "student").slice(0, 20);
  const [confirmLock, setConfirmLock] = useState(false);
  const [confirmPub, setConfirmPub] = useState(false);

  const avgCgpa = students.reduce((s, x) => s + (x.cgpa ?? 0), 0) / students.length;
  const backlogs = students.filter(s => (s.backlogs ?? 0) > 0).length;
  const top = students.filter(s => (s.cgpa ?? 0) >= 8.5).length;

  const doLock = () => {
    lockMarksCascade("CSE-A1", "Mid-Sem Internal-1", "DBMS", user?.id ?? "u_hoi");
    toast.success("Marks locked", { description: "Exam Cell notified." });
  };
  const doPublish = () => {
    publishResultsCascade("CSE-A1", "Mid-Sem Internal-1", user?.id ?? "u_hoi");
    toast.success("Results published", { description: "Students and parents notified." });
  };

  // CO attainment weighted (direct 80%, indirect 20%)
  const overall = COURSE_OUTCOMES.reduce((sum, co) => {
    const a = ATTAINMENT[co.id]; return sum + (a.direct * 0.8 + a.indirect * 0.2);
  }, 0) / COURSE_OUTCOMES.length;
  const overallStatus = overall >= TARGET ? "green" : overall >= TARGET - 10 ? "amber" : "red";

  return (
    <div>
      <PageHeader title="Results" subtitle="Internal grades, semester results, CGPA & CO-PO attainment"
        action={<div className="flex gap-2">
          <Button variant="outline" onClick={() => setConfirmLock(true)}><Lock className="h-4 w-4 mr-2" />Lock Marks</Button>
          <Button onClick={() => setConfirmPub(true)}><Download className="h-4 w-4 mr-2" />Publish</Button>
        </div>} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Avg CGPA" value={avgCgpa.toFixed(2)} icon={Award} tone="teal" />
        <KpiCard label="Top performers (8.5+)" value={top} icon={TrendingUp} tone="green" />
        <KpiCard label="Students w/ backlogs" value={backlogs} icon={AlertCircle} tone="amber" />
        <KpiCard label="Results published" value="4 / 5" icon={FileBarChart} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="copo">CO-PO Attainment</TabsTrigger>
          <TabsTrigger value="toppers">Toppers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Roll No</TableHead><TableHead>Student</TableHead><TableHead>Section</TableHead><TableHead>CGPA</TableHead><TableHead>Attendance</TableHead><TableHead>Backlogs</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {students.map(s => {
                  const cgpa = s.cgpa ?? 0;
                  return (
                    <TableRow key={s.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs">{s.rollNo}</TableCell>
                      <TableCell><Link to="/people/students/$id" params={{ id: s.id }} className="font-medium hover:underline">{s.firstName} {s.lastName}</Link></TableCell>
                      <TableCell>{s.sectionId}</TableCell>
                      <TableCell><Badge variant="secondary" className={cgpa >= 8.5 ? "bg-lnx-green-500/10 text-lnx-green-500" : cgpa >= 7 ? "bg-lnx-teal-500/10 text-lnx-teal-500" : "bg-lnx-amber-500/10 text-lnx-amber-500"}>{cgpa.toFixed(2)}</Badge></TableCell>
                      <TableCell>{s.attendancePct ?? 0}%</TableCell>
                      <TableCell>{s.backlogs ?? 0}</TableCell>
                      <TableCell><Badge variant={(s.backlogs ?? 0) > 0 ? "destructive" : "secondary"}>{(s.backlogs ?? 0) > 0 ? "Has backlogs" : "Clear"}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="copo" className="mt-4 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lnx-navy-800">CSE · Sem 5 · Database Management Systems</h3>
                <p className="text-xs text-muted-foreground">CO-PO mapping strength (0–3) · attainment weighted Direct 80% + Indirect 20%</p>
              </div>
              <Badge variant="secondary" className={
                overallStatus === "green" ? "bg-lnx-green-500/10 text-lnx-green-500" :
                overallStatus === "amber" ? "bg-lnx-amber-500/10 text-lnx-amber-500" :
                "bg-lnx-red-500/10 text-lnx-red-500"}>
                <Target className="h-3 w-3 mr-1" />Overall: {overall.toFixed(1)}% (target {TARGET}%)
              </Badge>
            </div>

            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-semibold">CO</th>
                    {PROGRAM_OUTCOMES.map(po => <th key={po} className="py-2 px-2 font-semibold text-center w-12">{po}</th>)}
                    <th className="py-2 px-2 text-center w-20">Direct</th>
                    <th className="py-2 px-2 text-center w-20">Indirect</th>
                    <th className="py-2 px-2 text-center w-24">Weighted</th>
                  </tr>
                </thead>
                <tbody>
                  {COURSE_OUTCOMES.map(co => {
                    const map = MAPPING[co.id];
                    const att = ATTAINMENT[co.id];
                    const weighted = att.direct * 0.8 + att.indirect * 0.2;
                    const tone = weighted >= TARGET ? "text-lnx-green-500" : weighted >= TARGET - 10 ? "text-lnx-amber-500" : "text-lnx-red-500";
                    return (
                      <tr key={co.id} className="border-b hover:bg-muted/30">
                        <td className="py-2 px-2">
                          <p className="font-mono font-semibold">{co.id}</p>
                          <p className="text-[10px] text-muted-foreground">{co.desc}</p>
                        </td>
                        {map.map((v, i) => (
                          <td key={i} className="text-center py-2 px-2">
                            {v === 0 ? <span className="text-muted-foreground">—</span> :
                              <span className={`inline-block w-6 h-6 rounded font-mono text-[11px] leading-6 ${
                                v === 3 ? "bg-lnx-teal-500 text-white" : v === 2 ? "bg-lnx-teal-500/40 text-lnx-teal-500" : "bg-muted text-foreground"
                              }`}>{v}</span>}
                          </td>
                        ))}
                        <td className="text-center py-2 px-2 tabular">{att.direct}%</td>
                        <td className="text-center py-2 px-2 tabular text-muted-foreground">{att.indirect}%</td>
                        <td className={`text-center py-2 px-2 font-semibold tabular ${tone}`}>{weighted.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toast.success("CO-PO report exported", { description: "PDF saved for NBA SAR evidence" })}>
                <Download className="h-3 w-3 mr-1" />Export for SAR
              </Button>
              <Link to="/compliance/nba"><Button variant="outline" size="sm">Open NBA cockpit →</Button></Link>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="toppers" className="mt-4">
          <Card className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Rank</TableHead><TableHead>Student</TableHead><TableHead>Section</TableHead><TableHead>CGPA</TableHead></TableRow></TableHeader>
              <TableBody>
                {[...students].sort((a, b) => (b.cgpa ?? 0) - (a.cgpa ?? 0)).slice(0, 10).map((s, i) => (
                  <TableRow key={s.id}>
                    <TableCell><Badge variant={i < 3 ? "default" : "outline"}>#{i + 1}</Badge></TableCell>
                    <TableCell><Link to="/people/students/$id" params={{ id: s.id }} className="font-medium hover:underline">{s.firstName} {s.lastName}</Link></TableCell>
                    <TableCell>{s.sectionId}</TableCell>
                    <TableCell><Badge variant="secondary" className="bg-lnx-green-500/10 text-lnx-green-500">{(s.cgpa ?? 0).toFixed(2)}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog open={confirmLock} onOpenChange={setConfirmLock} title="Lock marks for CSE-A1?" description="Once locked, edits require HOI approval. Exam Cell will be notified." confirmLabel="Lock marks" onConfirm={doLock} />
      <ConfirmDialog open={confirmPub} onOpenChange={setConfirmPub} title="Publish results?" description={`${students.length} students and their parents will be notified. Grade cards will be generated.`} confirmLabel="Publish now" onConfirm={doPublish} />
    </div>
  );
}
