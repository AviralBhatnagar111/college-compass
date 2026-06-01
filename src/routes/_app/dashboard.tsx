import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Users, GraduationCap, ClipboardList, Wallet, Briefcase, ShieldCheck,
  CheckCircle2, XCircle, Calendar, Award, BookMarked, KeyRound, BadgeCheck,
  FileText, AlertTriangle, Clock, TrendingUp, Bell, Plus, FileSpreadsheet,
  Send, Bot, ScrollText, Building2, ListChecks, Eye, MessageSquare,
  CreditCard, GitPullRequest, RotateCcw, BookOpen, Activity, MonitorPlay,
  Phone, Lock, MapPin, DollarSign,
} from "lucide-react";

import { KpiCard } from "@/components/common/KpiCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/common/Avatar";
import { EmptyState } from "@/components/common/EmptyState";
import { DashboardHero, DemoBanner, Section, QuickAction } from "@/components/dashboard/Chrome";
import { useAccess } from "@/lib/access";
import {
  useAccessStore, useUsersStore, useAcademicStore, usePlacementStore,
  useFinanceStore, useCommStore, useComplianceStore,
} from "@/stores";
import { payFeeCascade } from "@/lib/cascade";
import { ROLE_LABEL } from "@/lib/types";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LearnNowX" }] }),
  component: DashboardRouter,
});

function DashboardRouter() {
  const { user } = useAccess();
  if (!user) return null;
  return (
    <div>
      <DemoBanner user={user} />
      {(() => {
        switch (user.role) {
          case "hoi": return <HoiDashboard />;
          case "registrar": return <RegistrarDashboard />;
          case "tpo_head": return <TpoDashboard />;
          case "finance_head": return <FinanceDashboard />;
          case "exam_head": return <ExamDashboard />;
          case "hod": return <HodDashboard />;
          case "faculty": return <FacultyDashboard />;
          case "lab_faculty": return <LabFacultyDashboard />;
          case "student": return <StudentDashboard />;
          case "parent": return <ParentDashboard />;
          default: return <GenericDashboard />;
        }
      })()}
    </div>
  );
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const lakhs = (n: number) => `₹${(n / 100000).toFixed(2)}L`;

// ════════════════════════════════════════════════════════════════════════
// HOI / DIRECTOR — institutional cockpit
// ════════════════════════════════════════════════════════════════════════
function HoiDashboard() {
  const { user } = useAccess();
  const requests = useAccessStore(s => s.requests).filter(r => r.status === "pending");
  const resolve = useAccessStore(s => s.resolveRequest);
  const audit = useAccessStore(s => s.audit).slice(0, 8);
  const users = useUsersStore(s => s.users);
  const criteria = useComplianceStore(s => s.criteria);
  const drives = usePlacementStore(s => s.drives);
  const ledger = useFinanceStore(s => s.ledger);
  const attendance = useAcademicStore(s => s.attendance);

  const students = users.filter(u => u.role === "student");
  const faculty = users.filter(u => ["faculty","lab_faculty","hod"].includes(u.role));
  const naacReadiness = Math.round(criteria.reduce((a, c) => a + c.readiness, 0) / criteria.length);
  const todayAtt = (() => {
    const recent = attendance.slice(0, 30);
    if (!recent.length) return 91;
    let p = 0, t = 0;
    recent.forEach(r => Object.values(r.marks).forEach(m => { t++; if (m === "P" || m === "ML") p++; }));
    return t ? Math.round((p / t) * 100) : 91;
  })();
  const monthCollection = ledger.filter(l => l.payment).reduce((a, l) => a + (l.payment ?? 0), 0) + 4830000;
  const placementYtd = 76;

  // Risk flags
  const lowAttDept = ["ME"];
  const bigDefaulters = students.filter(s => (s.attendancePct ?? 100) < 65).length;
  const redCriteria = criteria.filter(c => c.status === "red");

  return (
    <>
      <DashboardHero user={user!} kpis={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <KpiCard label="Active Students" value={students.length} icon={GraduationCap} delta={{ value: "+12", up: true }} />
          <KpiCard label="Faculty" value={faculty.length} icon={Users} delta={{ value: "2 vacant", up: false }} />
          <KpiCard label="Attendance Today" value={`${todayAtt}%`} icon={ClipboardList} tone={todayAtt >= 80 ? "green" : "amber"} />
          <KpiCard label="Fees This Month" value={lakhs(monthCollection)} icon={Wallet} delta={{ value: "82% of ₹60L target", up: true }} />
          <KpiCard label="Placement YTD" value={`${placementYtd}%`} icon={Briefcase} tone="teal" delta={{ value: "↑ from 71%", up: true }} />
          <KpiCard label="NAAC Readiness" value={`${naacReadiness}%`} icon={ShieldCheck} tone={naacReadiness >= 75 ? "green" : "amber"} />
        </div>
      } />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section title="Pending Approvals" className="lg:col-span-2"
          action={<Link to="/admin/access-control/requests" className="text-xs font-medium text-lnx-teal-500 hover:underline">View all ({requests.length})</Link>}>
          <Card className="p-4">
            {requests.length === 0
              ? <EmptyState title="All caught up" body="No pending approvals" icon={CheckCircle2} />
              : <div className="divide-y">
                  {requests.slice(0, 5).map(r => {
                    const target = users.find(u => u.id === r.userId);
                    return (
                      <div key={r.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar firstName={"${target?.firstName} ${target?.lastName}".split(" ")[0]} lastName={"${target?.firstName} ${target?.lastName}".split(" ")[1]} color={target?.avatarColor} size="sm" />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-lnx-navy-800">{target?.firstName} {target?.lastName}</div>
                            <div className="truncate text-xs text-muted-foreground">{r.change} · {r.reason}</div>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => { resolve(r.id, "rejected", "", user!.id); toast.info("Request rejected"); }}>
                            <XCircle className="mr-1 h-3 w-3" /> Reject
                          </Button>
                          <Button size="sm" onClick={() => { resolve(r.id, "approved", "", user!.id); toast.success("Request approved"); }}>
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Approve
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>}
          </Card>
        </Section>

        <Section title="Risk Flags">
          <Card className="space-y-3 p-4">
            <RiskRow icon={AlertTriangle} tone="red" label="ME Dept attendance below 70%" sub="Action: notify HOD" to="/people/students" />
            <RiskRow icon={Wallet} tone="amber" label={`${bigDefaulters} defaulters above ₹10L threshold`} sub="Send reminder batch" to="/finance/defaulters" />
            <RiskRow icon={ShieldCheck} tone={redCriteria.length ? "red" : "green"} label={`${redCriteria.length} NAAC criteria in red`} sub="Open Cockpit" to="/compliance/naac" />
            <RiskRow icon={Users} tone="amber" label="2 faculty over workload ceiling" sub="Review schedule" to="/people/faculty" />
          </Card>
        </Section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section title="Admission Funnel">
          <Card className="p-4">
            <Funnel rows={[
              { label: "Inquired", value: 1420, pct: 100 },
              { label: "Counselled", value: 982, pct: 69 },
              { label: "Applied", value: 612, pct: 43 },
              { label: "Documents", value: 487, pct: 34 },
              { label: "Approved", value: 320, pct: 23 },
              { label: "Enrolled", value: 287, pct: 20 },
            ]} />
          </Card>
        </Section>

        <Section title="Department Performance">
          <Card className="p-4">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr><th className="pb-2 font-medium">Dept</th><th className="pb-2 font-medium">Att</th><th className="pb-2 font-medium">Plc</th><th className="pb-2 font-medium">NAAC</th></tr>
              </thead>
              <tbody>
                {[
                  { d: "CSE", a: "green", p: "green", n: "green" },
                  { d: "ECE", a: "amber", p: "amber", n: "green" },
                  { d: "ME", a: "red", p: "amber", n: "amber" },
                  { d: "CIVIL", a: "green", p: "amber", n: "amber" },
                  { d: "BIOTECH", a: "amber", p: "red", n: "amber" },
                ].map(r => (
                  <tr key={r.d} className="border-t">
                    <td className="py-2 font-medium text-lnx-navy-800">{r.d}</td>
                    <td className="py-2"><RagChip tone={r.a as any} /></td>
                    <td className="py-2"><RagChip tone={r.p as any} /></td>
                    <td className="py-2"><RagChip tone={r.n as any} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        <Section title="Compliance Status">
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-2">
              {criteria.map(c => (
                <Link key={c.id} to="/compliance/naac" className="rounded-lg border p-2 hover:border-lnx-teal-500">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">C{c.number}</div>
                  <div className="truncate text-xs font-medium text-lnx-navy-800">{c.name}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <Progress value={c.readiness} className="h-1.5 flex-1" />
                    <span className="ml-2 text-[10px] tabular text-muted-foreground">{c.readiness}%</span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </Section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Placement Pulse — 6 months">
          <Card className="p-4">
            <BarMini labels={["Jul","Aug","Sep","Oct","Nov","Dec"]} drives={[3,5,4,7,6,8]} offers={[4,8,11,18,15,24]} />
            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <span><span className="inline-block h-2 w-2 rounded-sm bg-lnx-teal-500" /> Drives</span>
              <span><span className="inline-block h-2 w-2 rounded-sm bg-lnx-navy-800" /> Offers</span>
              <span className="tabular">{drives.filter(d => d.status === "active").length} active drives now</span>
            </div>
          </Card>
        </Section>

        <Section title="Recent Activity">
          <Card className="p-4">
            <div className="divide-y">
              {audit.slice(0, 6).map(a => {
                const actor = users.find(u => u.id === a.actorId);
                return (
                  <div key={a.id} className="flex items-center gap-3 py-2 first:pt-0">
                    <Avatar name={actor ? `${actor.firstName} ${actor.lastName}` : "System"} color={actor?.avatarColor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs text-lnx-navy-800"><strong>{actor?.firstName ?? "System"}</strong> {a.action}</div>
                      <div className="text-[10px] text-muted-foreground">{a.module} · {formatDistanceToNow(new Date(a.at), { addSuffix: true })}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Section>
      </div>

      <Section title="Quick Actions" className="mt-6">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <QuickAction icon={GitPullRequest} label="Review Approvals" href="/admin/access-control/requests" tone="primary" />
          <QuickAction icon={Users} label="View All People" href="/admin/access-control/people" />
          <QuickAction icon={FileSpreadsheet} label="Export Institution Report" onClick={() => toast.success("PDF generated · Sample-Report.pdf")} />
          <QuickAction icon={ShieldCheck} label="NAAC Cockpit" href="/compliance/naac" />
        </div>
      </Section>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// REGISTRAR — pipelines & documents
// ════════════════════════════════════════════════════════════════════════
function RegistrarDashboard() {
  const { user } = useAccess();
  const users = useUsersStore(s => s.users);
  const students = users.filter(u => u.role === "student");
  const sample = students.slice(0, 5);

  const verify = (name: string) => toast.success(`DigiLocker fetched · ${name} verified`);
  const generate = (name: string, type: string) => toast.success(`${type} generated for ${name} · sample.pdf`);

  return (
    <>
      <DashboardHero user={user!} kpis={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="New Inquiries Today" value={14} icon={MessageSquare} delta={{ value: "+3 vs yest", up: true }} />
          <KpiCard label="Applications in Progress" value={87} icon={ScrollText} />
          <KpiCard label="Docs Pending Verification" value={23} icon={FileText} tone="amber" />
          <KpiCard label="Certificate Requests" value={11} icon={BadgeCheck} tone="teal" />
        </div>
      } />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Document Verification Queue">
          <Card className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr><th className="px-3 py-2 text-left">Student</th><th className="px-3 py-2 text-left">Missing</th><th className="px-3 py-2"></th></tr>
              </thead>
              <tbody>
                {sample.map(s => (
                  <tr key={s.id} className="border-t">
                    <td className="px-3 py-2"><div className="text-sm font-medium text-lnx-navy-800">{s.firstName} {s.lastName}</div><div className="text-[11px] text-muted-foreground">{s.rollNo}</div></td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">10th MS, Aadhaar</td>
                    <td className="px-3 py-2 text-right"><Button size="sm" variant="outline" onClick={() => verify(s.firstName)}>Verify · DigiLocker</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        <Section title="Certificate Request Queue">
          <Card className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr><th className="px-3 py-2 text-left">Student</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2"></th></tr>
              </thead>
              <tbody>
                {[
                  { s: sample[0], t: "Bonafide" },
                  { s: sample[1], t: "Transfer Certificate" },
                  { s: sample[2], t: "Character Certificate" },
                  { s: sample[3], t: "NOC" },
                ].filter(x => x.s).map(({ s, t }) => (
                  <tr key={s!.id + t} className="border-t">
                    <td className="px-3 py-2 text-sm font-medium text-lnx-navy-800">{s!.firstName} {s!.lastName}</td>
                    <td className="px-3 py-2 text-xs">{t}</td>
                    <td className="px-3 py-2 text-right"><Button size="sm" onClick={() => generate(s!.firstName, t)}>Generate</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Scholarship Verification Queue">
          <Card className="p-4">
            {[{ s: sample[0], k: "Merit Scholarship" }, { s: sample[1], k: "NSP — National" }].filter(x => x.s).map(({ s, k }, i) => (
              <div key={i} className="flex items-center justify-between border-t py-2 first:border-0 first:pt-0">
                <div><div className="text-sm font-medium text-lnx-navy-800">{s!.firstName} {s!.lastName}</div><div className="text-xs text-muted-foreground">{k}</div></div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => toast.info("Declined")}>Decline</Button>
                  <Button size="sm" onClick={() => toast.success("Approved · routed to Finance")}>Approve</Button>
                </div>
              </div>
            ))}
          </Card>
        </Section>

        <Section title="Admission Funnel by Program">
          <Card className="p-4 space-y-3">
            {[
              { p: "B.Tech CSE", applied: 412, enrolled: 80, conv: 19 },
              { p: "B.Tech ECE", applied: 318, enrolled: 60, conv: 19 },
              { p: "B.Tech ME", applied: 240, enrolled: 50, conv: 21 },
              { p: "MBA", applied: 198, enrolled: 40, conv: 20 },
            ].map(r => (
              <div key={r.p}>
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-lnx-navy-800">{r.p}</span>
                  <span className="text-muted-foreground tabular">{r.enrolled} / {r.applied} · {r.conv}%</span>
                </div>
                <Progress value={r.conv * 4} className="mt-1 h-2" />
              </div>
            ))}
          </Card>
        </Section>
      </div>

      <Section title="Quick Actions" className="mt-6">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <QuickAction icon={Plus} label="Add Inquiry" onClick={() => toast.success("Inquiry form opened")} tone="primary" />
          <QuickAction icon={Plus} label="Add Application" onClick={() => toast.success("New application started")} />
          <QuickAction icon={FileText} label="Bulk Document Verify" onClick={() => toast.info("Bulk DigiLocker batch started · 23 students")} />
          <QuickAction icon={Send} label="NSP Sync" onClick={() => toast.success("NSP scholarship data synced")} />
        </div>
      </Section>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// TPO HEAD — placement pipeline
// ════════════════════════════════════════════════════════════════════════
function TpoDashboard() {
  const { user } = useAccess();
  const drives = usePlacementStore(s => s.drives);
  const companies = usePlacementStore(s => s.companies);
  const ai = usePlacementStore(s => s.ai);
  const mcq = usePlacementStore(s => s.mcq);
  const offers = usePlacementStore(s => s.offers);
  const users = useUsersStore(s => s.users);
  const eligibleStudents = users.filter(u => u.role === "student" && (u.cgpa ?? 0) >= 6.5).length;
  const placedYtd = offers.length;
  const placedPct = Math.round((placedYtd / Math.max(eligibleStudents, 1)) * 100 * 25); // demo
  const avgPkg = "₹8.4 LPA";
  const mcqCompletion = Math.round((mcq.length / 30) * 100);

  return (
    <>
      <DashboardHero user={user!} kpis={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <KpiCard label="Active Drives" value={drives.filter(d => d.status === "active").length} icon={Briefcase} tone="teal" />
          <KpiCard label="Companies Engaged YTD" value={companies.length} icon={Building2} />
          <KpiCard label="Placed YTD" value={`${placedYtd} (${Math.min(placedPct, 76)}%)`} icon={BadgeCheck} tone="green" />
          <KpiCard label="Avg Package" value={avgPkg} icon={TrendingUp} delta={{ value: "↑ ₹1.2L", up: true }} />
          <KpiCard label="AI Test Completion" value={`${mcqCompletion}%`} icon={Bot} tone={mcqCompletion > 70 ? "green" : "amber"} />
        </div>
      } />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Drives This Week" action={<Link to="/placement/drives" className="text-xs font-medium text-lnx-teal-500 hover:underline">All drives</Link>}>
          <Card className="p-4 space-y-3">
            {drives.slice(0, 4).map(d => {
              const c = companies.find(x => x.id === d.companyId);
              return (
                <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lnx-navy-800 text-xs font-semibold text-white">{c?.name.slice(0, 2).toUpperCase()}</div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-lnx-navy-800">{c?.name} · {d.role}</div>
                      <div className="text-xs text-muted-foreground">{d.package} · {d.appliedIds.length} applied · {d.branches.join(", ")}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild><Link to="/placement/drives/$id" params={{ id: d.id }}>Manage</Link></Button>
                </div>
              );
            })}
          </Card>
        </Section>

        <Section title="Pending AI Interview Reviews">
          <Card className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr><th className="px-3 py-2 text-left">Student</th><th className="px-3 py-2 text-left">Score</th><th className="px-3 py-2"></th></tr>
              </thead>
              <tbody>
                {ai.slice(0, 5).map(a => {
                  const s = users.find(u => u.id === a.studentId);
                  return (
                    <tr key={a.id} className="border-t">
                      <td className="px-3 py-2"><div className="text-sm font-medium text-lnx-navy-800">{s?.firstName} {s?.lastName}</div><div className="text-[11px] text-muted-foreground">{s?.rollNo}</div></td>
                      <td className="px-3 py-2"><Badge variant={a.score >= 75 ? "default" : "outline"} className="tabular">{a.score}/100</Badge></td>
                      <td className="px-3 py-2 text-right"><Button size="sm" variant="outline" onClick={() => toast.info("Recording opened in player")}>Review</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </Section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section title="Branch-wise Performance" className="lg:col-span-2">
          <Card className="grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
            {[
              { l: "MCQ Attempted", v: 84, t: "green" },
              { l: "AI Interview Attempted", v: 62, t: "amber" },
              { l: "Avg MCQ", v: 71, t: "green" },
              { l: "Avg AI Score", v: 68, t: "amber" },
            ].map(p => (
              <div key={p.l} className="text-center">
                <DonutMini value={p.v} tone={p.t as any} />
                <div className="mt-2 text-[11px] text-muted-foreground">{p.l}</div>
              </div>
            ))}
          </Card>
        </Section>

        <Section title="Top Performers">
          <Card className="p-4 space-y-2">
            {mcq.slice(0, 5).sort((a, b) => b.score - a.score).map((m, i) => {
              const s = users.find(u => u.id === m.studentId);
              return (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="w-5 text-center text-xs font-bold text-lnx-navy-800">#{i + 1}</div>
                  <Avatar firstName={"${s?.firstName} ${s?.lastName}".split(" ")[0]} lastName={"${s?.firstName} ${s?.lastName}".split(" ")[1]} color={s?.avatarColor} size="sm" />
                  <div className="min-w-0 flex-1 text-xs"><div className="truncate font-medium text-lnx-navy-800">{s?.firstName} {s?.lastName}</div><div className="text-muted-foreground">CGPA {s?.cgpa}</div></div>
                  <Badge className="tabular">{m.score}/{m.total}</Badge>
                </div>
              );
            })}
          </Card>
        </Section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Drive Funnel — Razorpay SDE">
          <Card className="p-4">
            <Funnel rows={[
              { label: "Eligible", value: 28, pct: 100 },
              { label: "Applied", value: 18, pct: 64 },
              { label: "MCQ Cleared", value: 11, pct: 39 },
              { label: "AI Cleared", value: 6, pct: 21 },
              { label: "Offered", value: 2, pct: 7 },
              { label: "Joined", value: 1, pct: 4 },
            ]} />
          </Card>
        </Section>

        <Section title="Recent Offers">
          <Card className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-3 py-2 text-left">Student</th><th className="px-3 py-2 text-left">Company</th><th className="px-3 py-2 text-left">Package</th><th className="px-3 py-2 text-left">Status</th></tr></thead>
              <tbody>
                {offers.map(o => {
                  const s = users.find(u => u.id === o.studentId);
                  const c = companies.find(x => x.id === o.companyId);
                  return (
                    <tr key={o.id} className="border-t">
                      <td className="px-3 py-2 text-sm font-medium text-lnx-navy-800">{s?.firstName} {s?.lastName}</td>
                      <td className="px-3 py-2 text-xs">{c?.name}</td>
                      <td className="px-3 py-2 text-xs tabular">{o.package}</td>
                      <td className="px-3 py-2"><Badge variant={o.status === "accepted" ? "default" : "outline"}>{o.status}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </Section>
      </div>

      <Section title="Quick Actions" className="mt-6">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <QuickAction icon={Plus} label="Create Drive" href="/placement/drives" tone="primary" />
          <QuickAction icon={Building2} label="Add Company" href="/placement/companies" />
          <QuickAction icon={Bot} label="Generate MCQs from JD" href="/placement/ai-assessments" />
          <QuickAction icon={MonitorPlay} label="Configure AI Interview" href="/placement/ai-interviews" />
        </div>
      </Section>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// FINANCE HEAD — money flow
// ════════════════════════════════════════════════════════════════════════
function FinanceDashboard() {
  const { user } = useAccess();
  const ledger = useFinanceStore(s => s.ledger);
  const users = useUsersStore(s => s.users);
  const todayCollection = ledger.filter(l => l.payment).slice(0, 4).reduce((a, l) => a + (l.payment ?? 0), 0) + 184500;
  const pendingDues = 1240000;
  const students = users.filter(u => u.role === "student");
  const defaulters = students.filter(s => (s.attendancePct ?? 100) < 70).slice(0, 8);

  return (
    <>
      <DashboardHero user={user!} kpis={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <KpiCard label="Today's Collection" value={inr(todayCollection)} icon={Wallet} tone="green" />
          <KpiCard label="Pending Dues" value={lakhs(pendingDues)} icon={DollarSign} tone="amber" />
          <KpiCard label="Defaulters" value={defaulters.length + 30} icon={AlertTriangle} tone="red" />
          <KpiCard label="Refunds Pending" value={4} icon={RotateCcw} tone="amber" />
          <KpiCard label="Reconciliation" value="OK" icon={CheckCircle2} tone="green" />
        </div>
      } />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Refund Approval Queue">
          <Card className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-3 py-2 text-left">Student</th><th className="px-3 py-2 text-left">Amount</th><th className="px-3 py-2 text-left">Reason</th><th className="px-3 py-2"></th></tr></thead>
              <tbody>
                {students.slice(0, 4).map((s, i) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-3 py-2 text-sm font-medium text-lnx-navy-800">{s.firstName} {s.lastName}</td>
                    <td className="px-3 py-2 text-xs tabular">{inr([12000, 8500, 15000, 6000][i])}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{["Withdrawal","Excess pmt","Programme change","Hostel adj"][i]}</td>
                    <td className="px-3 py-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => toast.info("Rejected")}>Reject</Button>
                      <Button size="sm" className="ml-1.5" onClick={() => toast.success("Refund approved · queued for processing")}>Approve</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        <Section title="Waiver Approval Queue">
          <Card className="p-4 space-y-3">
            {students.slice(4, 7).map((s, i) => (
              <div key={s.id} className="flex items-center justify-between border-t pt-3 first:border-0 first:pt-0">
                <div>
                  <div className="text-sm font-medium text-lnx-navy-800">{s.firstName} {s.lastName}</div>
                  <div className="text-xs text-muted-foreground">{[25, 50, 30][i]}% waiver · {["EWS","Sibling","Merit"][i]}</div>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => toast.info("Rejected")}>Reject</Button>
                  <Button size="sm" onClick={() => toast.success("Waiver approved")}>Approve</Button>
                </div>
              </div>
            ))}
          </Card>
        </Section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section title="Daily Collection — 30 days" className="lg:col-span-2">
          <Card className="p-4">
            <LineMini values={Array.from({ length: 30 }, (_, i) => 80 + ((i * 13 + 17) % 70))} />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>30d ago</span><span className="tabular">Today · {inr(todayCollection)}</span>
            </div>
          </Card>
        </Section>

        <Section title="Scholarship Pipeline">
          <Card className="p-4 space-y-2 text-xs">
            {[
              { l: "Applied", v: 51, c: "bg-slate-100 text-slate-700" },
              { l: "Verified", v: 27, c: "bg-blue-100 text-blue-700" },
              { l: "Approved", v: 19, c: "bg-amber-100 text-amber-700" },
              { l: "Disbursed", v: 15, c: "bg-emerald-100 text-emerald-700" },
              { l: "NSP-Synced", v: 12, c: "bg-teal-100 text-teal-700" },
            ].map(r => (
              <div key={r.l} className={`flex items-center justify-between rounded px-2 py-1.5 ${r.c}`}>
                <span className="font-medium">{r.l}</span><span className="tabular">{r.v}</span>
              </div>
            ))}
          </Card>
        </Section>
      </div>

      <Section title="Top Defaulters" className="mt-4">
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-3 py-2 text-left">Student</th><th className="px-3 py-2 text-left">Amount</th><th className="px-3 py-2 text-left">Days Overdue</th><th className="px-3 py-2"></th></tr></thead>
            <tbody>
              {defaulters.map((s, i) => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2"><div className="text-sm font-medium text-lnx-navy-800">{s.firstName} {s.lastName}</div><div className="text-[11px] text-muted-foreground">{s.department} · {s.rollNo}</div></td>
                  <td className="px-3 py-2 text-xs tabular">{inr(60000 + i * 12000)}</td>
                  <td className="px-3 py-2 text-xs tabular text-lnx-red-500">{15 + i * 4}d</td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => toast.success(`Reminder sent · WhatsApp + Email to ${s.firstName}`)}><Send className="mr-1 h-3 w-3" />Send Reminder</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>

      <Section title="Quick Actions" className="mt-6">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <QuickAction icon={Plus} label="Add Fee Structure" href="/finance/fee-structures" tone="primary" />
          <QuickAction icon={Send} label="Bulk Send Reminders" onClick={() => toast.success("Bulk reminders queued · 38 recipients")} />
          <QuickAction icon={RotateCcw} label="Process Refund" onClick={() => toast.info("Refund flow opened")} />
          <QuickAction icon={FileSpreadsheet} label="Export Financial Report" onClick={() => toast.success("Financial report exported")} />
        </div>
      </Section>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// EXAM CELL HEAD — exam lifecycle
// ════════════════════════════════════════════════════════════════════════
function ExamDashboard() {
  const { user } = useAccess();
  return (
    <>
      <DashboardHero user={user!} kpis={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <KpiCard label="Upcoming Exams (30d)" value={8} icon={Calendar} tone="teal" />
          <KpiCard label="Eligibility Blocked" value={67} icon={Lock} tone="red" />
          <KpiCard label="Marks Entry" value="78%" icon={ClipboardList} tone="amber" />
          <KpiCard label="Results Pending Publish" value={3} icon={Award} />
          <KpiCard label="Re-evaluation Queue" value={9} icon={ScrollText} />
        </div>
      } />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Hall Ticket Override Queue">
          <Card className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-3 py-2 text-left">Student</th><th className="px-3 py-2 text-left">Block Reason</th><th className="px-3 py-2"></th></tr></thead>
              <tbody>
                {["Vikas Chauhan","Aarav Patel","Priya Sharma","Rohan Kumar"].map((n, i) => (
                  <tr key={n} className="border-t">
                    <td className="px-3 py-2 text-sm font-medium text-lnx-navy-800">{n}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{["Attendance < 75% (DBMS)","Fee dues ₹40k","Backlog OS 3","Attendance < 75% (CN)"][i]}</td>
                    <td className="px-3 py-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => toast.info("Override rejected")}>Reject</Button>
                      <Button size="sm" className="ml-1.5" onClick={() => toast.success("Override approved · hall ticket issued")}>Approve</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        <Section title="Marks Lock Requests">
          <Card className="p-4 space-y-3">
            {["DBMS · Prof Anjali Sharma","OS · Prof Meena Iyer","Maths III · Prof Arjun Nair"].map((s) => (
              <div key={s} className="flex items-center justify-between border-t pt-3 first:border-0 first:pt-0">
                <div className="text-sm font-medium text-lnx-navy-800">{s}</div>
                <Button size="sm" onClick={() => toast.success("Marks locked · ready to publish")}>Lock</Button>
              </div>
            ))}
          </Card>
        </Section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Result Publish Queue">
          <Card className="p-4 space-y-3">
            {["Sem 5 · CSE-A1 · Mid-Sem","Sem 5 · ECE-B1 · Mid-Sem","Sem 3 · ME-C1 · Internal-2"].map(r => (
              <div key={r} className="flex items-center justify-between rounded-lg border p-3">
                <div className="text-sm font-medium text-lnx-navy-800">{r}</div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => toast.info("Preview opened")}>Preview</Button>
                  <Button size="sm" onClick={() => toast.success("Results published · students & parents notified")}>Publish</Button>
                </div>
              </div>
            ))}
          </Card>
        </Section>

        <Section title="Marks Entry Progress">
          <Card className="p-4 space-y-3 text-xs">
            {[
              { s: "DBMS · Prof Anjali", v: 100 },
              { s: "OS · Prof Meena", v: 80 },
              { s: "Maths III · Prof Arjun", v: 60 },
              { s: "AIML · Prof Anjali", v: 45 },
              { s: "CN · Prof Neha", v: 20 },
            ].map(r => (
              <div key={r.s}>
                <div className="flex justify-between"><span className="font-medium text-lnx-navy-800">{r.s}</span><span className="text-muted-foreground tabular">{r.v}%</span></div>
                <Progress value={r.v} className="mt-1 h-2" />
              </div>
            ))}
          </Card>
        </Section>
      </div>

      <Section title="Quick Actions" className="mt-6">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <QuickAction icon={Plus} label="Create Exam Pattern" href="/academic/examinations" tone="primary" />
          <QuickAction icon={Calendar} label="Schedule Exam" href="/academic/examinations" />
          <QuickAction icon={FileText} label="Generate Hall Tickets" onClick={() => toast.success("Hall tickets generated · 1,180 PDFs")} />
          <QuickAction icon={Send} label="Push Latest to NAD" onClick={() => toast.success("NAD push initiated · DigiLocker sync")} />
        </div>
      </Section>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// HOD — department-scoped
// ════════════════════════════════════════════════════════════════════════
function HodDashboard() {
  const { user } = useAccess();
  const dept = user?.scope.ids[0] ?? user?.department ?? "CSE";
  const users = useUsersStore(s => s.users);
  const students = users.filter(u => u.role === "student" && u.department === dept);
  const faculty = users.filter(u => (u.role === "faculty" || u.role === "lab_faculty") && u.department === dept);
  const atRisk = students.filter(s => (s.attendancePct ?? 100) < 75 || (s.cgpa ?? 10) < 7).slice(0, 6);
  const topStudents = [...students].sort((a, b) => (b.cgpa ?? 0) - (a.cgpa ?? 0)).slice(0, 5);
  const backlogs = students.filter(s => (s.backlogs ?? 0) > 0).length;
  const avgAtt = Math.round(students.reduce((a, s) => a + (s.attendancePct ?? 0), 0) / Math.max(students.length, 1));

  return (
    <>
      <DashboardHero user={user!} kpis={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <KpiCard label={`${dept} Students`} value={students.length} icon={GraduationCap} />
          <KpiCard label={`${dept} Faculty`} value={faculty.length} icon={Users} delta={{ value: "1 vacant", up: false }} />
          <KpiCard label="Avg Attendance" value={`${avgAtt}%`} icon={ClipboardList} tone={avgAtt >= 75 ? "green" : "amber"} />
          <KpiCard label="Top 5 CGPA" value={(topStudents[0]?.cgpa ?? 0).toFixed(1)} icon={Award} tone="teal" />
          <KpiCard label="Active Backlogs" value={backlogs} icon={BookMarked} tone={backlogs > 5 ? "amber" : "default"} />
          <KpiCard label="Placements (batch)" value="68%" icon={Briefcase} tone="green" />
        </div>
      } />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Attendance Correction Requests">
          <Card className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-3 py-2 text-left">Faculty</th><th className="px-3 py-2 text-left">Change</th><th className="px-3 py-2"></th></tr></thead>
              <tbody>
                {faculty.slice(0, 3).map((f, i) => (
                  <tr key={f.id} className="border-t">
                    <td className="px-3 py-2 text-sm font-medium text-lnx-navy-800">Prof. {f.firstName} {f.lastName}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{["Rohan: A → P","Priya: A → ML","Vikas: A → P"][i]} · {["DBMS","OS","CN"][i]}</td>
                    <td className="px-3 py-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => toast.info("Rejected")}>Reject</Button>
                      <Button size="sm" className="ml-1.5" onClick={() => toast.success("Correction approved · cascaded to student")}>Approve</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        <Section title="Leave Applications">
          <Card className="p-4 space-y-3">
            {faculty.slice(0, 3).map((f, i) => (
              <div key={f.id} className="flex items-center justify-between border-t pt-3 first:border-0 first:pt-0">
                <div>
                  <div className="text-sm font-medium text-lnx-navy-800">Prof. {f.firstName} {f.lastName}</div>
                  <div className="text-xs text-muted-foreground">{["CL · 2 days","EL · 4 days","Half-day"][i]} · {["Family","Vacation","Medical"][i]}</div>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => toast.info("Rejected")}>Reject</Button>
                  <Button size="sm" onClick={() => toast.success("Leave approved")}>Approve</Button>
                </div>
              </div>
            ))}
          </Card>
        </Section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section title="Faculty Workload Heatmap" className="lg:col-span-2">
          <Card className="p-4">
            <div className="space-y-2">
              {faculty.slice(0, 6).map((f, i) => {
                const hrs = 8 + (i * 5) % 22;
                const tone = hrs > 22 ? "bg-lnx-red-500" : hrs > 16 ? "bg-lnx-amber-500" : "bg-lnx-green-500";
                return (
                  <div key={f.id} className="flex items-center gap-3">
                    <div className="w-32 truncate text-xs text-lnx-navy-800">Prof. {f.firstName}</div>
                    <div className="relative h-5 flex-1 rounded bg-muted">
                      <div className={`h-full rounded ${tone}`} style={{ width: `${Math.min(hrs * 4, 100)}%` }} />
                    </div>
                    <div className="w-12 text-right text-xs tabular text-muted-foreground">{hrs}h/wk</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Section>

        <Section title="At-Risk Students">
          <Card className="p-4 space-y-2">
            {atRisk.map(s => (
              <div key={s.id} className="flex items-center justify-between gap-2 border-t pt-2 first:border-0 first:pt-0">
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-lnx-navy-800">{s.firstName} {s.lastName}</div>
                  <div className="text-[11px] text-muted-foreground tabular">Att {s.attendancePct}% · CGPA {s.cgpa}</div>
                </div>
                <Button size="sm" variant="outline" className="shrink-0 text-[11px]" onClick={() => toast.success(`Parent notified · ${s.firstName}`)}>Notify Parent</Button>
              </div>
            ))}
          </Card>
        </Section>
      </div>

      <Section title="Quick Actions" className="mt-6">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <QuickAction icon={CheckCircle2} label="Approve Pending (Bulk)" onClick={() => toast.success("All pending items approved")} tone="primary" />
          <QuickAction icon={Plus} label="Assign Faculty to Subject" href="/academic/subjects" />
          <QuickAction icon={ShieldCheck} label="Submit NAAC Data" href="/compliance/naac" />
          <QuickAction icon={FileSpreadsheet} label="Department Report" onClick={() => toast.success(`${dept} report exported`)} />
        </div>
      </Section>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// FACULTY — daily teaching workflow
// ════════════════════════════════════════════════════════════════════════
function FacultyDashboard() {
  const { user } = useAccess();
  const academic = useAcademicStore();
  const todaysSchedule = useMemo(() => {
    const day = (new Date().getDay() + 6) % 7;
    return academic.timetable
      .filter(t => t.facultyId === user?.id && t.day === Math.min(day, 4))
      .slice(0, 5)
      .map((t, i) => {
        const sub = academic.subjects.find(s => s.id === t.subjectId);
        return {
          time: ["09:00","10:00","11:15","12:15","02:00"][i] ?? "TBD",
          subject: sub?.name ?? "—",
          code: sub?.code,
          section: t.sectionId,
          room: t.roomId,
          status: i === 0 ? "Marked" : i === 1 ? "Pending mark" : i === 2 ? "In progress" : "Upcoming",
        };
      });
  }, [academic, user?.id]);

  const pendingMark = todaysSchedule.filter(s => s.status === "Pending mark").length;

  return (
    <>
      <DashboardHero user={user!} kpis={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Today's Classes" value={todaysSchedule.length} icon={Calendar} tone="teal" />
          <KpiCard label="Pending Attendance" value={pendingMark} icon={ClipboardList} tone={pendingMark ? "red" : "green"} />
          <KpiCard label="Ungraded Submissions" value={7} icon={ScrollText} tone="amber" />
          <KpiCard label="Leave Balance" value="CL 8 · EL 4" icon={Award} />
        </div>
      } />

      <Section title="Today's Schedule">
        <Card className="p-4 space-y-2">
          {todaysSchedule.length === 0
            ? <EmptyState title="No classes today" body="Enjoy your day" icon={Calendar} />
            : todaysSchedule.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 text-center"><div className="text-sm font-semibold text-lnx-navy-800 tabular">{c.time}</div></div>
                  <div>
                    <div className="text-sm font-medium text-lnx-navy-800">{c.subject} <span className="text-xs font-normal text-muted-foreground">· {c.code}</span></div>
                    <div className="text-xs text-muted-foreground">{c.section} · {c.room}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={c.status === "Marked" ? "outline" : c.status === "Pending mark" ? "destructive" : c.status === "In progress" ? "default" : "secondary"} className="text-[10px]">{c.status}</Badge>
                  {c.status === "Pending mark" && <Button size="sm" asChild><Link to="/academic/attendance">Mark Now</Link></Button>}
                </div>
              </div>
            ))}
        </Card>
      </Section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section title="Pending Marks Entry">
          <Card className="p-4 space-y-2">
            {["Mid-Sem · DBMS","Mid-Sem · AIML"].map(s => (
              <div key={s} className="flex items-center justify-between border-t pt-2 first:border-0 first:pt-0">
                <div className="text-xs"><div className="font-medium text-lnx-navy-800">{s}</div><div className="text-muted-foreground">CSE-A1 · due in 3 days</div></div>
                <Button size="sm" variant="outline" asChild><Link to="/academic/examinations">Enter</Link></Button>
              </div>
            ))}
          </Card>
        </Section>

        <Section title="My Student Snapshot">
          <Card className="p-4 space-y-2 text-xs">
            {[
              { c: "CSE-A1 / DBMS", a: 78, m: 72, r: 3 },
              { c: "CSE-A2 / DBMS", a: 81, m: 75, r: 1 },
            ].map(r => (
              <div key={r.c} className="rounded border p-2">
                <div className="font-medium text-lnx-navy-800">{r.c}</div>
                <div className="mt-1 flex justify-between text-muted-foreground tabular">
                  <span>Att {r.a}%</span><span>Marks {r.m}%</span><span className="text-lnx-red-500">{r.r} at-risk</span>
                </div>
              </div>
            ))}
          </Card>
        </Section>

        <Section title="My Workload — This Week">
          <Card className="p-4">
            <div className="text-3xl font-semibold text-lnx-navy-800 tabular">18<span className="ml-1 text-sm font-normal text-muted-foreground">/ 22h</span></div>
            <Progress value={(18/22)*100} className="mt-2 h-2" />
            <div className="mt-2 text-xs text-muted-foreground">Under policy ceiling</div>
          </Card>
        </Section>
      </div>

      <Section title="Quick Actions" className="mt-6">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <QuickAction icon={ClipboardList} label="Mark Attendance" href="/academic/attendance" tone="primary" />
          <QuickAction icon={BookOpen} label="Upload Material" href="/academic/study-material" />
          <QuickAction icon={ScrollText} label="Enter Internal Marks" href="/academic/examinations" />
          <QuickAction icon={Calendar} label="Apply for Leave" onClick={() => toast.success("Leave application submitted to HOD")} />
          <QuickAction icon={GitPullRequest} label="Raise Correction" onClick={() => toast.success("Correction request raised")} />
        </div>
      </Section>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LAB FACULTY — faculty + lab overlay
// ════════════════════════════════════════════════════════════════════════
function LabFacultyDashboard() {
  const { user } = useAccess();
  return (
    <>
      <DashboardHero user={user!} kpis={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <KpiCard label="Today's Classes" value={4} icon={Calendar} tone="teal" />
          <KpiCard label="Today's Lab Sessions" value={2} icon={Activity} />
          <KpiCard label="Pending Attendance" value={1} icon={ClipboardList} tone="amber" />
          <KpiCard label="Active Coding Problems" value={6} icon={BookMarked} />
          <KpiCard label="AI Tests Configured" value={3} icon={Bot} tone="teal" />
        </div>
      } />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Active Lab Sessions">
          <Card className="p-4 space-y-3">
            {[
              { l: "DBMS Lab — CSE-A1", t: "10:00 · LAB-201", p: "18/20" },
              { l: "OS Lab — CSE-A2", t: "14:00 · LAB-202", p: "—" },
            ].map(s => (
              <div key={s.l} className="flex items-center justify-between rounded-lg border p-3">
                <div><div className="text-sm font-medium text-lnx-navy-800">{s.l}</div><div className="text-xs text-muted-foreground">{s.t} · Present {s.p}</div></div>
                <Button size="sm" onClick={() => toast.success("Lab attendance marked")}>Mark Lab Attendance</Button>
              </div>
            ))}
          </Card>
        </Section>

        <Section title="Coding Problems Assigned">
          <Card className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-3 py-2 text-left">Problem</th><th className="px-3 py-2 text-left">Submissions</th><th className="px-3 py-2"></th></tr></thead>
              <tbody>
                {["Two Sum Variants","SQL Joins Pset","Process Scheduling Sim","Linked List Reversal"].map((p, i) => (
                  <tr key={p} className="border-t">
                    <td className="px-3 py-2 text-sm">{p}</td>
                    <td className="px-3 py-2 text-xs tabular">{[18, 14, 9, 16][i]} / 20</td>
                    <td className="px-3 py-2 text-right"><Button size="sm" variant="outline" onClick={() => toast.info("Submissions opened")}>View</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Coding Lab Activity — 7 days">
          <Card className="p-4">
            <BarMini labels={["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]} drives={[8,12,9,14,11,4,3]} offers={[]} />
          </Card>
        </Section>
        <Section title="Lab Equipment Status">
          <Card className="p-4 space-y-2 text-xs">
            {[
              { e: "LAB-201 · 30 workstations", s: "OK" },
              { e: "LAB-202 · 28 workstations", s: "OK · 2 in repair" },
              { e: "Network printer", s: "Toner low" },
            ].map(r => (
              <div key={r.e} className="flex justify-between border-t pt-2 first:border-0 first:pt-0">
                <span className="text-lnx-navy-800">{r.e}</span><span className="text-muted-foreground">{r.s}</span>
              </div>
            ))}
          </Card>
        </Section>
      </div>

      <Section title="Quick Actions" className="mt-6">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <QuickAction icon={Activity} label="Mark Lab Attendance" onClick={() => toast.success("Lab attendance saved")} tone="primary" />
          <QuickAction icon={Plus} label="Assign Coding Problem" onClick={() => toast.success("Problem assigned")} />
          <QuickAction icon={Bot} label="Configure AI Test" href="/placement/ai-assessments" />
          <QuickAction icon={ClipboardList} label="Mark Theory Attendance" href="/academic/attendance" />
          <QuickAction icon={BookOpen} label="Upload Material" href="/academic/study-material" />
        </div>
      </Section>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// STUDENT — self-service hub
// ════════════════════════════════════════════════════════════════════════
function StudentDashboard() {
  const { user } = useAccess();
  const academic = useAcademicStore();
  const drives = usePlacementStore(s => s.drives).filter(d => d.branches.includes(user?.department ?? "") && d.status !== "completed");
  const att = user?.attendancePct ?? 0;
  const sub = academic.subjects;

  const nextClass = {
    subject: "DBMS", faculty: "Prof. Anjali Sharma", room: "LH-101", inMin: 22,
  };

  const subjectAtt = [
    { s: "DBMS", v: 78 }, { s: "OS", v: 72 }, { s: "Maths III", v: 81 }, { s: "AIML", v: 65 }, { s: "CN", v: 88 },
  ];

  return (
    <>
      <DashboardHero user={user!}
        intro={<div className="mt-1 text-sm text-muted-foreground">{user?.rollNo} · {user?.department} · Sem 5 · CGPA <strong className="tabular text-lnx-navy-800">{user?.cgpa}</strong></div>}
        kpis={
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard label="Cumulative CGPA" value={user?.cgpa ?? "—"} icon={Award} tone="teal" delta={{ value: "↑ 0.3", up: true }} />
            <KpiCard label="Today's Classes" value={5} icon={Calendar} />
            <KpiCard label="Attendance" value={`${att}%`} icon={ClipboardList} tone={att >= 75 ? "green" : att >= 65 ? "amber" : "red"} />
            <KpiCard label="Fee Due" value="₹60,000" icon={Wallet} tone="amber" delta={{ value: "due in 12 days", up: false }} />
          </div>
        } />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-lnx-teal-500/10 to-lnx-navy-800/5 p-5 lg:col-span-2">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Next Class · starts in</div>
          <div className="mt-1 text-4xl font-bold text-lnx-navy-800 tabular">{nextClass.inMin}<span className="ml-1 text-base font-normal text-muted-foreground">min</span></div>
          <div className="mt-2 text-base font-semibold text-lnx-navy-800">{nextClass.subject}</div>
          <div className="text-sm text-muted-foreground">{nextClass.faculty} · Room {nextClass.room}</div>
        </Card>

        <Card className="p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fee Due Alert</div>
          <div className="text-2xl font-bold text-lnx-navy-800 tabular">₹60,000</div>
          <div className="text-xs text-muted-foreground">Sem 5 · Instalment 2 · due in 12 days</div>
          <Button className="mt-3 w-full" asChild><Link to="/my/fees">Pay Now</Link></Button>
        </Card>
      </div>

      <Section title="Today's Timetable" className="mt-4">
        <Card className="overflow-x-auto p-4">
          <div className="flex gap-2">
            {[
              { t: "09:00", s: "DBMS", st: "Done" },
              { t: "10:00", s: "OS", st: "Live" },
              { t: "11:15", s: "Maths III", st: "Upcoming" },
              { t: "12:15", s: "AIML Lab", st: "Upcoming" },
              { t: "02:00", s: "CN", st: "Upcoming" },
            ].map((c, i) => (
              <div key={i} className="min-w-[140px] rounded-lg border p-3">
                <div className="text-xs text-muted-foreground tabular">{c.t}</div>
                <div className="text-sm font-medium text-lnx-navy-800">{c.s}</div>
                <Badge variant={c.st === "Live" ? "default" : c.st === "Done" ? "outline" : "secondary"} className="mt-1.5 text-[10px]">{c.st}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Active AI Assessments">
          <Card className="p-4 space-y-3">
            {drives.slice(0, 2).map(d => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border p-3">
                <div><div className="text-sm font-medium text-lnx-navy-800">{d.role} MCQ</div><div className="text-xs text-muted-foreground">30 questions · 45 min</div></div>
                <Button size="sm" asChild><Link to="/placement/ai-assessments">Take Now</Link></Button>
              </div>
            ))}
          </Card>
        </Section>

        <Section title="Attendance by Subject">
          <Card className="p-4 flex flex-wrap gap-2">
            {subjectAtt.map(s => {
              const tone = s.v >= 75 ? "bg-emerald-100 text-emerald-700" : s.v >= 65 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
              return <span key={s.s} className={`rounded-full px-3 py-1 text-xs font-medium ${tone} tabular`}>{s.s} {s.v}%</span>;
            })}
          </Card>
        </Section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Recent Results">
          <Card className="p-4">
            <div className="text-sm font-medium text-lnx-navy-800">Semester 4 · 2024-25</div>
            <div className="mt-1 text-2xl font-bold text-lnx-teal-500 tabular">SGPA 8.2</div>
            <Button size="sm" variant="outline" className="mt-3" asChild><Link to="/my/results">View Grade Card</Link></Button>
          </Card>
        </Section>
        <Section title="Recent Study Material">
          <Card className="p-4 space-y-2 text-xs">
            {["DBMS · Unit 3 Normalization","OS · Process Sync Notes","AIML · Decision Trees PDF","CN · OSI Layers slides"].map(m => (
              <div key={m} className="flex items-center justify-between border-t pt-2 first:border-0 first:pt-0">
                <span className="text-lnx-navy-800">{m}</span>
                <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => toast.success("Download started")}>Download</Button>
              </div>
            ))}
          </Card>
        </Section>
      </div>

      <Section title="Quick Actions" className="mt-6">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <QuickAction icon={Wallet} label="Pay Fees" href="/my/fees" tone="primary" />
          <QuickAction icon={Calendar} label="Apply for Leave" onClick={() => toast.success("Leave application submitted")} />
          <QuickAction icon={Award} label="Apply for Scholarship" onClick={() => toast.success("Scholarship form opened")} />
          <QuickAction icon={FileText} label="Request Bonafide" onClick={() => toast.success("Bonafide request raised")} />
          <QuickAction icon={ScrollText} label="My Hall Ticket" onClick={() => toast.success("Hall ticket downloaded")} />
        </div>
      </Section>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// PARENT — single child focus
// ════════════════════════════════════════════════════════════════════════
function ParentDashboard() {
  const { user } = useAccess();
  const child = useUsersStore(s => s.users.find(u => u.id === user?.childId));
  const notifs = useCommStore(s => s.notifications).filter(n => n.userId === user?.id).slice(0, 4);
  const attendance = useAcademicStore(s => s.attendance);

  const todayStatus = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todays = attendance.filter(a => a.date === today && child && a.marks[child.id]);
    if (!todays.length) return { status: "no_class", label: "No classes scheduled today" };
    const lastMark = todays[0].marks[child!.id];
    if (lastMark === "A") return { status: "absent", label: `Was absent in last class` };
    return { status: "present", label: "In class right now · DBMS · Room 304" };
  }, [attendance, child]);

  const [wa, setWa] = [true, () => {}];

  if (!child) return <EmptyState title="No child linked" body="Contact registrar to link your child's account" icon={Users} />;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-lnx-navy-800">Welcome, Mr. {user?.lastName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{format(new Date(), "EEEE, dd MMM yyyy")}</p>
      </div>

      <Card className="mb-5 flex items-center gap-4 p-4">
        <Avatar firstName={"${child.firstName} ${child.lastName}".split(" ")[0]} lastName={"${child.firstName} ${child.lastName}".split(" ")[1]} color={child.avatarColor} size="lg" />
        <div className="flex-1">
          <div className="text-lg font-semibold text-lnx-navy-800">{child.firstName} {child.lastName}</div>
          <div className="text-xs text-muted-foreground">{child.rollNo} · {child.department} · Sem 5 · Batch {child.batch}</div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Today's Status"
          value={todayStatus.status === "present" ? "Present" : todayStatus.status === "absent" ? "Absent" : "—"}
          icon={Activity}
          tone={todayStatus.status === "present" ? "green" : todayStatus.status === "absent" ? "red" : "default"} />
        <KpiCard label="Cumulative CGPA" value={child.cgpa ?? "—"} icon={Award} tone="teal" />
        <KpiCard label="Overall Attendance" value={`${child.attendancePct}%`} icon={ClipboardList} tone={(child.attendancePct ?? 0) >= 75 ? "green" : "amber"} />
        <KpiCard label="Fee Due" value="₹60,000" icon={Wallet} tone="red" />
      </div>

      <Card className={`mt-5 p-4 ${todayStatus.status === "absent" ? "border-lnx-red-500/40 bg-lnx-red-500/5" : todayStatus.status === "present" ? "border-lnx-green-500/40 bg-lnx-green-500/5" : ""}`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${todayStatus.status === "absent" ? "bg-lnx-red-500/20 text-lnx-red-500" : "bg-lnx-green-500/20 text-lnx-green-500"}`}>
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-lnx-navy-800">{child.firstName} {todayStatus.label}</div>
            <div className="text-xs text-muted-foreground">Updated {format(new Date(), "h:mm a")}</div>
          </div>
          <Button variant="outline" size="sm" asChild><Link to="/dashboard">View attendance</Link></Button>
        </div>
      </Card>

      <Card className="mt-4 flex items-center justify-between gap-3 border-lnx-amber-500/40 bg-lnx-amber-500/5 p-4">
        <div>
          <div className="text-sm font-semibold text-lnx-navy-800">Fee due ₹60,000 · {child.firstName}</div>
          <div className="text-xs text-muted-foreground">Sem 5 · Instalment 2 · due in 12 days</div>
        </div>
        <Button onClick={() => { payFeeCascade(child.id, 60000, "Razorpay UPI", user!.id); toast.success("Payment successful · ₹60,000"); }}><CreditCard className="mr-1.5 h-4 w-4" />Pay on Behalf</Button>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section title="30-day Attendance" className="lg:col-span-2">
          <Card className="p-4">
            <LineMini values={Array.from({ length: 30 }, (_, i) => 60 + ((i * 11 + 7) % 35))} threshold={75} />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>30d ago</span><span className="tabular">Today · {child.attendancePct}%</span>
            </div>
          </Card>
        </Section>

        <Section title="Subject-wise Attendance">
          <Card className="p-4 flex flex-wrap gap-2">
            {[{s:"DBMS",v:78},{s:"OS",v:72},{s:"Maths",v:81},{s:"AIML",v:65}].map(s => {
              const tone = s.v >= 75 ? "bg-emerald-100 text-emerald-700" : s.v >= 65 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
              return <span key={s.s} className={`rounded-full px-3 py-1 text-xs font-medium ${tone} tabular`}>{s.s} {s.v}%</span>;
            })}
          </Card>
        </Section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Recent Results">
          <Card className="p-4">
            <div className="text-sm font-medium text-lnx-navy-800">Semester 4 · 2024-25</div>
            <div className="mt-1 text-2xl font-bold text-lnx-teal-500 tabular">SGPA 8.2</div>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => toast.success("Grade card PDF downloaded")}>Download Grade Card</Button>
          </Card>
        </Section>

        <Section title="Messages & WhatsApp">
          <Card className="p-4">
            <div className="mb-3 space-y-1 text-xs">
              {notifs.length === 0 && <div className="text-muted-foreground">No new messages</div>}
              {notifs.map(n => <div key={n.id} className="border-t pt-1.5 first:border-0 first:pt-0"><div className="font-medium text-lnx-navy-800">{n.title}</div><div className="text-muted-foreground">{n.meta}</div></div>)}
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <div className="text-xs"><div className="font-medium text-lnx-navy-800">WhatsApp Alerts</div><div className="text-muted-foreground">Get instant updates</div></div>
              <Switch defaultChecked />
            </div>
          </Card>
        </Section>
      </div>

      <Section title="Quick Actions" className="mt-6">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <QuickAction icon={CreditCard} label={`Pay ${child.firstName}'s Fees`} href="/my/fees" tone="primary" />
          <QuickAction icon={MessageSquare} label="Message Faculty" href="/communication/inbox" />
          <QuickAction icon={Phone} label="Message TPO" href="/communication/inbox" />
          <QuickAction icon={FileText} label="View Documents" onClick={() => toast.info("Documents opened")} />
          <QuickAction icon={Bell} label="Enable WhatsApp Alerts" onClick={() => toast.success("WhatsApp alerts enabled")} />
        </div>
      </Section>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Generic fallback
// ════════════════════════════════════════════════════════════════════════
function GenericDashboard() {
  const { user } = useAccess();
  return (
    <div>
      <DashboardHero user={user!} kpis={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Open Tasks" value={4} icon={ListChecks} />
          <KpiCard label="Notifications" value={2} icon={Bell} />
          <KpiCard label="Messages" value={3} icon={MessageSquare} />
          <KpiCard label="Approvals" value={1} icon={CheckCircle2} />
        </div>
      } />
      <Card className="p-6 text-sm text-muted-foreground">{ROLE_LABEL[user!.role]} workspace — use the sidebar to navigate.</Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Visual primitives
// ════════════════════════════════════════════════════════════════════════
function RiskRow({ icon: Icon, tone, label, sub, to }: { icon: any; tone: "red" | "amber" | "green"; label: string; sub: string; to: string }) {
  const colors = { red: "text-lnx-red-500", amber: "text-lnx-amber-500", green: "text-lnx-green-500" };
  return (
    <Link to={to} className="flex items-center gap-3 rounded-md border p-2 hover:border-lnx-teal-500">
      <Icon className={`h-4 w-4 shrink-0 ${colors[tone]}`} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium text-lnx-navy-800">{label}</div>
        <div className="truncate text-[10px] text-muted-foreground">{sub}</div>
      </div>
    </Link>
  );
}

function RagChip({ tone }: { tone: "red" | "amber" | "green" }) {
  const cls = { red: "bg-red-100 text-red-700", amber: "bg-amber-100 text-amber-700", green: "bg-emerald-100 text-emerald-700" };
  return <span className={`inline-block h-5 w-5 rounded-full ${cls[tone]}`} />;
}

function Funnel({ rows }: { rows: { label: string; value: number; pct: number }[] }) {
  return (
    <div className="space-y-1.5">
      {rows.map(r => (
        <div key={r.label} className="flex items-center gap-2">
          <div className="w-24 truncate text-xs text-lnx-navy-800">{r.label}</div>
          <div className="relative h-6 flex-1 rounded bg-muted">
            <div className="h-full rounded bg-gradient-to-r from-lnx-teal-500 to-lnx-navy-800" style={{ width: `${r.pct}%` }} />
            <div className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] font-semibold text-white tabular">{r.value} · {r.pct}%</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutMini({ value, tone }: { value: number; tone: "green" | "amber" | "red" | "teal" }) {
  const color = { green: "stroke-emerald-500", amber: "stroke-amber-500", red: "stroke-red-500", teal: "stroke-lnx-teal-500" }[tone];
  const c = 2 * Math.PI * 24;
  return (
    <div className="relative inline-block">
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="24" fill="none" stroke="currentColor" className="text-muted opacity-20" strokeWidth="6" />
        <circle cx="32" cy="32" r="24" fill="none" className={color} strokeWidth="6" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} strokeLinecap="round" transform="rotate(-90 32 32)" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-lnx-navy-800 tabular">{value}%</div>
    </div>
  );
}

function BarMini({ labels, drives, offers }: { labels: string[]; drives: number[]; offers: number[] }) {
  const max = Math.max(...drives, ...offers, 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {labels.map((l, i) => (
        <div key={l} className="flex flex-1 flex-col items-center gap-0.5">
          <div className="flex w-full items-end justify-center gap-0.5" style={{ height: "100%" }}>
            <div className="w-2 rounded-t bg-lnx-teal-500" style={{ height: `${(drives[i] / max) * 100}%` }} />
            {offers.length > 0 && <div className="w-2 rounded-t bg-lnx-navy-800" style={{ height: `${(offers[i] / max) * 100}%` }} />}
          </div>
          <div className="text-[10px] text-muted-foreground">{l}</div>
        </div>
      ))}
    </div>
  );
}

function LineMini({ values, threshold }: { values: number[]; threshold?: number }) {
  const w = 600, h = 80, max = 100, min = 0;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / (max - min)) * h}`).join(" ");
  const thresholdY = threshold ? h - ((threshold - min) / (max - min)) * h : 0;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20">
      {threshold && <line x1="0" x2={w} y1={thresholdY} y2={thresholdY} className="stroke-lnx-red-500" strokeDasharray="4 3" strokeWidth="1" opacity="0.5" />}
      <polyline points={points} fill="none" className="stroke-lnx-teal-500" strokeWidth="2" />
      <polygon points={`0,${h} ${points} ${w},${h}`} className="fill-lnx-teal-500" opacity="0.1" />
    </svg>
  );
}
