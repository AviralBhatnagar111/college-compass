import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar } from "@/components/common/Avatar";
import { AttendanceChip } from "@/components/common/StateBadges";
import { useUsersStore, useAcademicStore } from "@/stores";
import { KpiCard } from "@/components/common/KpiCard";
import { Search, GraduationCap, AlertTriangle, TrendingUp, Download, Upload } from "lucide-react";

export const Route = createFileRoute("/_app/people/students")({
  head: () => ({ meta: [{ title: "Students — LearnNowX" }] }),
  component: StudentsPage,
});

function StudentsPage() {
  const all = useUsersStore(s => s.users).filter(u => u.role === "student");
  const sections = useAcademicStore(s => s.sections);
  const [q, setQ] = useState("");
  const [section, setSection] = useState("all");
  const [att, setAtt] = useState("all");

  const filtered = useMemo(() => all.filter(s => {
    if (section !== "all" && s.sectionId !== section) return false;
    if (att === "low" && (s.attendancePct ?? 0) >= 75) return false;
    if (att === "critical" && (s.attendancePct ?? 0) >= 65) return false;
    if (q && !`${s.firstName} ${s.lastName} ${s.rollNo}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [all, q, section, att]);

  const avgAtt = Math.round(all.reduce((a, b) => a + (b.attendancePct ?? 0), 0) / all.length);
  const lowAtt = all.filter(s => (s.attendancePct ?? 0) < 75).length;
  const backlogs = all.filter(s => (s.backlogs ?? 0) > 0).length;

  return (
    <div>
      <PageHeader
        title="Students (SIS)"
        subtitle={`${filtered.length} of ${all.length} students`}
        action={<div className="flex gap-2"><Button variant="outline" size="sm"><Upload className="mr-1 h-4 w-4" />Bulk Upload</Button><Button variant="outline" size="sm"><Download className="mr-1 h-4 w-4" />Export</Button></div>}
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name, roll number…" value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
            </div>
            <Select value={section} onValueChange={setSection}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All sections</SelectItem>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
            <Select value={att} onValueChange={setAtt}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All attendance</SelectItem><SelectItem value="low">Below 75%</SelectItem><SelectItem value="critical">Below 65%</SelectItem></SelectContent></Select>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 mb-6 md:grid-cols-4">
        <KpiCard label="Total Students" value={all.length} icon={GraduationCap} />
        <KpiCard label="Avg Attendance" value={`${avgAtt}%`} icon={TrendingUp} tone="green" />
        <KpiCard label="Low Attendance" value={lowAtt} icon={AlertTriangle} tone="amber" />
        <KpiCard label="With Backlogs" value={backlogs} icon={AlertTriangle} tone="red" />
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-4 py-2">Student</th><th>Roll No</th><th>Section</th><th>CGPA</th><th>Attendance</th><th>Backlogs</th></tr>
            </thead>
            <tbody className="divide-y">
              {filtered.slice(0, 100).map(s => (
                <tr key={s.id} className="hover:bg-accent/40">
                  <td className="px-4 py-2">
                    <Link to="/people/students/$id" params={{ id: s.id }} className="flex items-center gap-2">
                      <Avatar initials={s.initials} color={s.avatarColor} size="sm" />
                      <div><div className="font-medium text-lnx-navy-800">{s.firstName} {s.lastName}</div><div className="text-xs text-muted-foreground">{s.email}</div></div>
                    </Link>
                  </td>
                  <td className="text-xs">{s.rollNo}</td>
                  <td>{s.sectionId}</td>
                  <td className="tabular">{s.cgpa?.toFixed(2)}</td>
                  <td><AttendanceChip pct={s.attendancePct ?? 0} /></td>
                  <td>{(s.backlogs ?? 0) > 0 ? <Badge variant="destructive">{s.backlogs}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
