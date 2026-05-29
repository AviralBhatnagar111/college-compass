import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download, FileText, Filter, Plus, Sparkles, Table as TableIcon, LineChart, PieChart, Wand2 } from "lucide-react";
import { KpiCard } from "@/components/common/KpiCard";
import { useState } from "react";

export const Route = createFileRoute("/_app/analytics/reports")({
  head: () => ({ meta: [{ title: "Reports — LearnNowX" }] }),
  component: ReportsPage,
});

const REPORTS = [
  { id: "R1", name: "Placement Season Report", category: "Placement", lastRun: "2 hrs ago", scheduled: "Weekly", icon: BarChart3 },
  { id: "R2", name: "Attendance Defaulters", category: "Academic", lastRun: "Yesterday", scheduled: "Daily", icon: FileText },
  { id: "R3", name: "Fee Collection Summary", category: "Finance", lastRun: "Today 9am", scheduled: "Daily", icon: BarChart3 },
  { id: "R4", name: "CGPA Distribution by Section", category: "Academic", lastRun: "3 days ago", scheduled: "Monthly", icon: PieChart },
  { id: "R5", name: "Faculty Workload", category: "HR", lastRun: "1 week ago", scheduled: "Monthly", icon: LineChart },
  { id: "R6", name: "Scholarship Disbursal Status", category: "Finance", lastRun: "Today", scheduled: "Weekly", icon: TableIcon },
  { id: "R7", name: "NAAC Evidence Readiness", category: "Compliance", lastRun: "1 day ago", scheduled: "Weekly", icon: FileText },
  { id: "R8", name: "Drive Conversion Funnel", category: "Placement", lastRun: "4 hrs ago", scheduled: "Weekly", icon: BarChart3 },
];

function ReportsPage() {
  const [category, setCategory] = useState("all");
  const filtered = REPORTS.filter(r => category === "all" || r.category === category);

  return (
    <div>
      <PageHeader title="Reports" subtitle="Pre-built reports + custom builder"
        action={<Button><Plus className="h-4 w-4 mr-2" />Custom Report</Button>} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Pre-built" value={REPORTS.length} icon={FileText} tone="teal" />
        <KpiCard label="Scheduled" value={REPORTS.filter(r=>r.scheduled).length} icon={FileText} tone="amber" />
        <KpiCard label="Run This Week" value={42} icon={BarChart3} />
        <KpiCard label="Custom" value={3} icon={Sparkles} tone="green" />
      </div>
      <Tabs defaultValue="library">
        <TabsList>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="builder">Custom Builder</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-4">
          <div className="flex gap-2 mb-4">
            {["all","Academic","Placement","Finance","HR","Compliance"].map(c => (
              <Button key={c} variant={category===c?"default":"outline"} size="sm" onClick={() => setCategory(c)}>{c === "all" ? "All" : c}</Button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(r => (
              <Card key={r.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-md bg-lnx-teal-500/10 text-lnx-teal-500 grid place-items-center"><r.icon className="h-5 w-5" /></div>
                  <Badge variant="outline" className="text-[10px]">{r.category}</Badge>
                </div>
                <h3 className="font-semibold text-lnx-navy-800">{r.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">Last run: {r.lastRun} · {r.scheduled}</p>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">Schedule</Button>
                  <Button size="sm" className="flex-1"><Download className="h-3 w-3 mr-1" />Run</Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="builder" className="mt-4">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4"><Wand2 className="h-5 w-5 text-lnx-teal-500" /><h3 className="font-semibold">Build a Custom Report</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>Data Source</Label>
                <Select defaultValue="students"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="students">Students</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                    <SelectItem value="placements">Placements</SelectItem>
                    <SelectItem value="finance">Finance Ledger</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Group By</Label>
                <Select defaultValue="section"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="section">Section</SelectItem>
                    <SelectItem value="program">Program</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="batch">Batch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Time Range</Label>
                <Select defaultValue="month"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Last 7 days</SelectItem>
                    <SelectItem value="month">Last 30 days</SelectItem>
                    <SelectItem value="quarter">Last 3 months</SelectItem>
                    <SelectItem value="year">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4"><Label>Filters</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary" className="gap-1"><Filter className="h-3 w-3" />CGPA ≥ 7.0 <button className="ml-1 hover:text-lnx-red-500">×</button></Badge>
                <Badge variant="secondary" className="gap-1"><Filter className="h-3 w-3" />Department: CSE <button className="ml-1 hover:text-lnx-red-500">×</button></Badge>
                <Button variant="outline" size="sm" className="h-6 text-xs"><Plus className="h-3 w-3 mr-1" />Add filter</Button>
              </div>
            </div>
            <div className="mt-4"><Label>Visualization</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[["Table",TableIcon],["Bar",BarChart3],["Line",LineChart],["Pie",PieChart]].map(([n, I]: any) => (
                  <Button key={n} variant="outline" className="h-16 flex-col gap-1"><I className="h-5 w-5" /><span className="text-xs">{n}</span></Button>
                ))}
              </div>
            </div>
            <div className="mt-6 flex gap-2"><Button variant="outline">Save as Template</Button><Button><Sparkles className="h-4 w-4 mr-2" />Generate Report</Button></div>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="mt-4">
          <Card className="p-0"><div className="divide-y">
            {REPORTS.filter(r=>r.scheduled).map(r => (
              <div key={r.id} className="p-4 flex items-center justify-between">
                <div><p className="font-medium text-sm">{r.name}</p><p className="text-xs text-muted-foreground">{r.category} · Runs {r.scheduled}</p></div>
                <div className="flex items-center gap-2"><Badge variant="secondary">{r.scheduled}</Badge><Button variant="ghost" size="sm">Edit</Button></div>
              </div>
            ))}
          </div></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
