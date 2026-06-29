import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { KpiCard } from "@/components/common/KpiCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useAcademicStore, useUsersStore, useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { PdfPreviewDialog } from "@/components/dashboard/ActionQueue";
import { ShieldCheck, AlertTriangle, CheckCircle2, FileText, Download, Upload, Search, Users, FlaskConical, BookOpen, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/compliance/aicte")({
  head: () => ({ meta: [{ title: "AICTE Compliance — LearnNowX" }] }),
  component: AictePage,
});

// AICTE Mandatory Disclosure norms
const NORMS = [
  { id: "FSR", name: "Faculty-Student Ratio", required: "1:20", actual: "1:18", ok: true, icon: Users },
  { id: "FPHD", name: "Faculty with PhD", required: "≥ 40%", actual: "69%", ok: true, icon: BookOpen },
  { id: "LAB", name: "Lab Equipment per AICTE", required: "100%", actual: "94%", ok: false, icon: FlaskConical, gap: "2 ECE lab items pending procurement" },
  { id: "LIB", name: "Library Volumes per Student", required: "≥ 15", actual: "22", ok: true, icon: BookOpen },
  { id: "BFT", name: "Built-up Area per Student", required: "≥ 7 sqm", actual: "8.4 sqm", ok: true, icon: Building2 },
  { id: "PWD", name: "Differently-Abled Facilities", required: "Ramps + Lift + Toilet", actual: "All present", ok: true, icon: ShieldCheck },
  { id: "ANT", name: "Anti-Ragging Compliance", required: "Affidavits + Committee + Drill", actual: "All filed", ok: true, icon: ShieldCheck },
  { id: "POSH", name: "POSH (Internal Complaints Committee)", required: "Constituted + Quarterly review", actual: "ICC active · 3 meetings YTD", ok: true, icon: ShieldCheck },
];

const DISCLOSURES = [
  { code: "MD-1.1", title: "Name, Address, Sponsoring Society", uploaded: true, lastUpdate: "Apr 2025", responsible: "Registrar" },
  { code: "MD-2.1", title: "Approval Letter (AICTE Form-1)", uploaded: true, lastUpdate: "Jun 2025", responsible: "Registrar" },
  { code: "MD-3.1", title: "Programs & Sanctioned Intake", uploaded: true, lastUpdate: "Aug 2025", responsible: "Registrar" },
  { code: "MD-4.1", title: "Faculty Details (with Photographs)", uploaded: false, lastUpdate: "—", responsible: "HR" },
  { code: "MD-5.1", title: "Fee Structure (3 yrs)", uploaded: true, lastUpdate: "Sep 2025", responsible: "Finance" },
  { code: "MD-6.1", title: "Admission Procedure", uploaded: true, lastUpdate: "May 2025", responsible: "Admissions" },
  { code: "MD-7.1", title: "Examination & Evaluation Norms", uploaded: true, lastUpdate: "Aug 2025", responsible: "Exam Cell" },
  { code: "MD-8.1", title: "Library Resources", uploaded: true, lastUpdate: "Sep 2025", responsible: "Librarian" },
  { code: "MD-9.1", title: "Lab & Workshop Facilities", uploaded: false, lastUpdate: "—", responsible: "HOD CSE" },
  { code: "MD-10.1", title: "Hostel & Other Amenities", uploaded: true, lastUpdate: "Mar 2025", responsible: "Hostel Warden" },
  { code: "MD-11.1", title: "Anti-Ragging Affidavits", uploaded: true, lastUpdate: "Jul 2025", responsible: "Dean Students" },
  { code: "MD-12.1", title: "Grievance Redressal Mechanism", uploaded: true, lastUpdate: "Apr 2025", responsible: "Registrar" },
];

const RETURNS = [
  { name: "AICTE Annual Return", deadline: "30 Sep 2026", status: "Filed", icon: CheckCircle2 },
  { name: "EOA Application (Extension of Approval)", deadline: "31 Mar 2026", status: "Pending", icon: AlertTriangle },
  { name: "Faculty Self-Disclosure Portal", deadline: "Quarterly", status: "Up to date", icon: CheckCircle2 },
  { name: "Mandatory Disclosure (Website)", deadline: "Continuous", status: "10/12 published", icon: AlertTriangle },
];

function AictePage() {
  const faculty = useUsersStore(s => s.users.filter(u => u.role === "faculty" || u.role === "lab_faculty" || u.role === "hod"));
  const students = useUsersStore(s => s.users.filter(u => u.role === "student"));
  const departments = useAcademicStore(s => s.departments);
  const addAudit = useAccessStore(s => s.addAudit);
  const { user } = useAccess();
  const [q, setQ] = useState("");
  const [eoa, setEoa] = useState(false);

  const audit = (a: string, r?: string) => addAudit({ id: `a_${Date.now()}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hoi", module: "AICTE", action: a, reason: r });

  const fsr = `1:${Math.round(students.length / faculty.length)}`;
  const filed = DISCLOSURES.filter(d => d.uploaded).length;
  const compliancePct = Math.round((NORMS.filter(n => n.ok).length / NORMS.length + filed / DISCLOSURES.length) / 2 * 100);

  const filtered = DISCLOSURES.filter(d => !q || d.title.toLowerCase().includes(q.toLowerCase()) || d.code.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader title="AICTE Compliance" subtitle="All India Council for Technical Education · Mandatory Disclosure & Annual Returns"
        action={<div className="flex gap-2"><Button variant="outline" onClick={()=>{ audit("Exported Mandatory Disclosure"); toast.success("Mandatory Disclosure PDF exported"); }}><Download className="h-4 w-4 mr-2" />Export MD</Button><Button onClick={()=>setEoa(true)}><FileText className="h-4 w-4 mr-2" />File EOA</Button></div>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Overall Compliance" value={`${compliancePct}%`} icon={ShieldCheck} tone={compliancePct >= 90 ? "green" : compliancePct >= 75 ? "amber" : "red"} />
        <KpiCard label="Faculty-Student Ratio" value={fsr} icon={Users} tone="green" delta={{ value: "AICTE 1:20", up: true }} />
        <KpiCard label="Disclosures Published" value={`${filed}/${DISCLOSURES.length}`} icon={FileText} tone={filed === DISCLOSURES.length ? "green" : "amber"} />
        <KpiCard label="Open Gaps" value={NORMS.filter(n => !n.ok).length + (DISCLOSURES.length - filed)} icon={AlertTriangle} tone="amber" />
      </div>

      <Tabs defaultValue="norms">
        <TabsList>
          <TabsTrigger value="norms">Norms & Standards</TabsTrigger>
          <TabsTrigger value="disclosures">Mandatory Disclosures</TabsTrigger>
          <TabsTrigger value="returns">Returns & Deadlines</TabsTrigger>
          <TabsTrigger value="intake">Sanctioned Intake</TabsTrigger>
        </TabsList>

        <TabsContent value="norms" className="mt-4 grid md:grid-cols-2 gap-3">
          {NORMS.map(n => {
            const Icon = n.icon;
            return (
              <Card key={n.id} className={cn("p-4 border-l-4", n.ok ? "border-l-lnx-green-500" : "border-l-lnx-amber-500")}>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-accent p-2"><Icon className="h-4 w-4 text-lnx-navy-800" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between"><h3 className="font-semibold text-sm text-lnx-navy-800">{n.name}</h3>{n.ok ? <CheckCircle2 className="h-4 w-4 text-lnx-green-500" /> : <AlertTriangle className="h-4 w-4 text-lnx-amber-500" />}</div>
                    <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                      <div><div className="text-muted-foreground">AICTE Norm</div><div className="font-medium mt-0.5">{n.required}</div></div>
                      <div><div className="text-muted-foreground">Actual</div><div className={cn("font-semibold tabular mt-0.5", n.ok ? "text-lnx-green-500" : "text-lnx-amber-500")}>{n.actual}</div></div>
                    </div>
                    {!n.ok && n.gap && <div className="mt-2 rounded bg-lnx-amber-500/5 p-2 text-xs text-lnx-amber-500">⚠ {n.gap}</div>}
                  </div>
                </div>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="disclosures" className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search disclosures…" className="pl-9" /></div>
            <Badge variant="outline">{filtered.length} of {DISCLOSURES.length}</Badge>
          </div>
          <Card>
            <table className="w-full text-sm">
              <thead className="bg-accent/40 text-xs uppercase text-muted-foreground"><tr>
                <th className="text-left p-3 pl-4">Code</th><th className="text-left p-3">Disclosure</th><th className="text-left p-3">Responsible</th><th className="text-left p-3">Last Update</th><th className="text-left p-3">Status</th><th></th>
              </tr></thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.code} className="border-t hover:bg-accent/30">
                    <td className="p-3 pl-4 font-mono text-xs">{d.code}</td>
                    <td className="p-3 font-medium">{d.title}</td>
                    <td className="p-3 text-muted-foreground">{d.responsible}</td>
                    <td className="p-3 text-muted-foreground tabular">{d.lastUpdate}</td>
                    <td className="p-3">{d.uploaded ? <Badge className="bg-lnx-green-500/10 text-lnx-green-500 border-lnx-green-500/30">Published</Badge> : <Badge className="bg-lnx-amber-500/10 text-lnx-amber-500 border-lnx-amber-500/30">Pending</Badge>}</td>
                    <td className="p-3 text-right pr-4">{d.uploaded ? <Button variant="ghost" size="sm" onClick={()=>toast.info(`Viewing ${d.code}`)}>View</Button> : <Button size="sm" onClick={()=>{ audit(`Marked ${d.code} for upload`); toast.success(`${d.code} flagged to ${d.responsible}`); }}><Upload className="h-3 w-3 mr-1" />Request</Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="returns" className="mt-4 space-y-3">
          {RETURNS.map(r => {
            const Icon = r.icon;
            const overdue = r.status === "Pending";
            return (
              <Card key={r.name} className={cn("p-4 flex items-center gap-4", overdue && "border-lnx-amber-500/40")}>
                <Icon className={cn("h-5 w-5", overdue ? "text-lnx-amber-500" : "text-lnx-green-500")} />
                <div className="flex-1 min-w-0"><h3 className="font-semibold text-sm text-lnx-navy-800">{r.name}</h3><p className="text-xs text-muted-foreground">Deadline: {r.deadline}</p></div>
                <Badge variant="outline" className={overdue ? "border-lnx-amber-500/40 text-lnx-amber-500" : "border-lnx-green-500/40 text-lnx-green-500"}>{r.status}</Badge>
                <Button variant={overdue ? "default" : "outline"} size="sm" onClick={()=>{ audit(`Opened ${r.name}`); toast.info(`${r.name} workflow opens here`); }}>{overdue ? "File now" : "Open"}</Button>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="intake" className="mt-4">
          <Card>
            <div className="border-b p-4"><h3 className="font-semibold text-lnx-navy-800">Sanctioned vs Actual Intake</h3><p className="text-xs text-muted-foreground mt-0.5">As per AICTE EOA · academic year 2025-26</p></div>
            <table className="w-full text-sm">
              <thead className="bg-accent/40 text-xs uppercase text-muted-foreground"><tr>
                <th className="text-left p-3 pl-4">Program</th><th className="p-3 text-right">Sanctioned</th><th className="p-3 text-right">Admitted</th><th className="p-3 text-right">Vacancy %</th><th className="text-left p-3">Status</th>
              </tr></thead>
              <tbody>
                {departments.map(d => {
                  const enrolled = students.filter(s => s.department === d.id).length;
                  const sanctioned = d.id === "ECE" ? 30 : d.id === "ME" || d.id === "CIVIL" ? 25 : d.id === "BIOTECH" ? 20 : d.id === "MBA" ? 30 : 40;
                  const vacancy = Math.max(0, Math.round((1 - enrolled / sanctioned) * 100));
                  return (
                    <tr key={d.id} className="border-t hover:bg-accent/30">
                      <td className="p-3 pl-4 font-medium">{d.name}</td>
                      <td className="p-3 text-right tabular">{sanctioned}</td>
                      <td className="p-3 text-right tabular">{enrolled}</td>
                      <td className="p-3 text-right tabular"><span className={cn(vacancy > 30 ? "text-lnx-red-500 font-semibold" : vacancy > 15 ? "text-lnx-amber-500" : "text-lnx-green-500")}>{vacancy}%</span></td>
                      <td className="p-3"><div className="flex items-center gap-2 max-w-[160px]"><Progress value={Math.round(enrolled / sanctioned * 100)} className="h-1.5" /></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>

      <PdfPreviewDialog open={eoa} onOpenChange={setEoa}
        title="EOA Application Draft" docType="Extension of Approval" recipient="AICTE Regional Office (Western)"
        fields={[
          { label: "Institution", value: "Bharat Institute of Engineering & Management" },
          { label: "Compliance %", value: `${compliancePct}%` },
          { label: "FSR", value: fsr },
          { label: "Disclosures Published", value: `${filed}/${DISCLOSURES.length}` },
          { label: "Academic Year", value: "2026-27" },
        ]}
        confirmLabel="Submit EOA Draft"
        onConfirm={()=>audit("Filed AICTE EOA Application", `Compliance ${compliancePct}%`)}
      />
    </div>
  );
}
