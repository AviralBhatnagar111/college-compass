import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar } from "@/components/common/Avatar";
import { AttendanceChip } from "@/components/common/StateBadges";
import { useUsersStore, useAcademicStore, useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { KpiCard } from "@/components/common/KpiCard";
import { Search, GraduationCap, AlertTriangle, TrendingUp, Download, Upload, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/people/students")({
  head: () => ({ meta: [{ title: "Students — LearnNowX" }] }),
  component: StudentsPage,
});

type Parsed = { firstName: string; lastName: string; email: string; rollNo: string; sectionId: string; ok: boolean; reason?: string };

function StudentsPage() {
  const users = useUsersStore(s => s.users);
  const addUser = useUsersStore(s => s.addUser);
  const addAudit = useAccessStore(s => s.addAudit);
  const { user: me } = useAccess();
  const all = users.filter(u => u.role === "student");
  const sections = useAcademicStore(s => s.sections);
  const [q, setQ] = useState("");
  const [section, setSection] = useState("all");
  const [att, setAtt] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [parsed, setParsed] = useState<Parsed[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const downloadCsv = (filename: string, rows: string[][]) => {
    const csv = rows.map(r => r.map(c => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = filename; link.click();
    URL.revokeObjectURL(url);
  };

  const onExport = () => {
    const rows = [["Roll No","First Name","Last Name","Email","Section","Program","Batch","CGPA","Attendance %","Backlogs","Status"]];
    filtered.forEach(s => rows.push([s.rollNo ?? "", s.firstName, s.lastName, s.email, s.sectionId ?? "", s.programId ?? "", s.batch ?? "", String(s.cgpa ?? ""), String(s.attendancePct ?? ""), String(s.backlogs ?? 0), s.status]));
    downloadCsv(`students-${new Date().toISOString().slice(0,10)}.csv`, rows);
    toast.success(`Exported ${filtered.length} students to CSV`);
    addAudit({ id: `a_${Date.now()}`, at: new Date().toISOString(), actorId: me?.id ?? "system", action: "students.export", module: "people", after: { count: filtered.length } });
  };

  const onTemplate = () => downloadCsv("students-template.csv", [["firstName","lastName","email","rollNo","sectionId"],["Aarav","Sharma","aarav@example.com","CS25001","CSE-A1"]]);

  const onPickFile = () => fileRef.current?.click();
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const text = await f.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (!lines.length) { toast.error("Empty file"); return; }
    const headers = lines[0].split(",").map(h => h.trim().replaceAll('"',''));
    const sectionIds = new Set(sections.map(s => s.id));
    const existingEmails = new Set(users.map(u => u.email.toLowerCase()));
    const rows: Parsed[] = lines.slice(1).map(line => {
      const cols = line.split(",").map(c => c.trim().replaceAll('"',''));
      const rec: any = {}; headers.forEach((h,i) => rec[h] = cols[i] ?? "");
      const r: Parsed = { firstName: rec.firstName, lastName: rec.lastName, email: rec.email, rollNo: rec.rollNo, sectionId: rec.sectionId, ok: true };
      if (!r.firstName || !r.lastName) { r.ok = false; r.reason = "missing name"; }
      else if (!r.email?.includes("@")) { r.ok = false; r.reason = "invalid email"; }
      else if (existingEmails.has(r.email.toLowerCase())) { r.ok = false; r.reason = "duplicate email"; }
      else if (!sectionIds.has(r.sectionId)) { r.ok = false; r.reason = `unknown section ${r.sectionId}`; }
      return r;
    });
    setParsed(rows);
    setUploadOpen(true);
    if (fileRef.current) fileRef.current.value = "";
  };

  const commitUpload = () => {
    const good = parsed.filter(p => p.ok);
    good.forEach((p, i) => {
      const id = `u_stu_${Date.now().toString(36)}_${i}`;
      const initials = (p.firstName[0] + p.lastName[0]).toUpperCase();
      addUser({
        id, firstName: p.firstName, lastName: p.lastName, email: p.email, role: "student",
        rollNo: p.rollNo, sectionId: p.sectionId, programId: "CSE-BTECH", batch: "2024-2028",
        cgpa: 7.5, attendancePct: 80, backlogs: 0, packId: "student_self",
        scope: { level: "section", ids: [p.sectionId] }, overrides: [], status: "active",
        loginMethod: "password", initials, avatarColor: "#0EA5A0",
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), updatedBy: me?.id,
      });
    });
    addAudit({ id: `a_${Date.now()}`, at: new Date().toISOString(), actorId: me?.id ?? "system", action: "students.bulk_import", module: "people", after: { imported: good.length, skipped: parsed.length - good.length } });
    toast.success(`Imported ${good.length} students`, { description: parsed.length - good.length > 0 ? `${parsed.length - good.length} rows skipped` : undefined });
    setUploadOpen(false); setParsed([]);
  };

  return (
    <div>
      <PageHeader
        title="Students (SIS)"
        subtitle={`${filtered.length} of ${all.length} students`}
        action={<div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
          <Button variant="outline" size="sm" onClick={onPickFile}><Upload className="mr-1 h-4 w-4" />Bulk Upload</Button>
          <Button variant="outline" size="sm" onClick={onExport}><Download className="mr-1 h-4 w-4" />Export</Button>
        </div>}
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
              {filtered.map(s => (
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

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Bulk Upload — Preview</DialogTitle></DialogHeader>
          {parsed.length === 0 ? (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">Upload a CSV with columns: firstName, lastName, email, rollNo, sectionId.</p>
              <Button variant="outline" size="sm" onClick={onTemplate}><FileText className="h-3 w-3 mr-1" />Download template</Button>
            </div>
          ) : (
            <>
              <div className="text-xs flex gap-3 mb-2">
                <Badge className="bg-lnx-green-500/10 text-lnx-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />{parsed.filter(p=>p.ok).length} ready</Badge>
                <Badge className="bg-lnx-amber-500/10 text-lnx-amber-500"><AlertTriangle className="h-3 w-3 mr-1" />{parsed.filter(p=>!p.ok).length} skipped</Badge>
              </div>
              <div className="max-h-72 overflow-y-auto border rounded-md">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 sticky top-0"><tr><th className="text-left p-2">Roll</th><th className="text-left p-2">Name</th><th className="text-left p-2">Email</th><th className="text-left p-2">Section</th><th className="text-left p-2">Status</th></tr></thead>
                  <tbody className="divide-y">
                    {parsed.map((p,i) => (
                      <tr key={i} className={!p.ok ? "bg-lnx-red-500/5" : ""}>
                        <td className="p-2 font-mono">{p.rollNo}</td>
                        <td className="p-2">{p.firstName} {p.lastName}</td>
                        <td className="p-2 text-muted-foreground">{p.email}</td>
                        <td className="p-2">{p.sectionId}</td>
                        <td className="p-2">{p.ok ? <span className="text-lnx-green-500">OK</span> : <span className="text-lnx-red-500">{p.reason}</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadOpen(false); setParsed([]); }}>Cancel</Button>
            {parsed.length > 0 && <Button onClick={commitUpload} disabled={!parsed.some(p=>p.ok)}>Import {parsed.filter(p=>p.ok).length}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
