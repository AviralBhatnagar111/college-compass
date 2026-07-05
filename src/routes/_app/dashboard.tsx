import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Users, GraduationCap, ClipboardList, Wallet, Briefcase, ShieldCheck,
  Calendar, Award, KeyRound, BadgeCheck, FileText, AlertTriangle, Clock,
  TrendingUp, Bell, Plus, FileSpreadsheet, Send, Bot, ScrollText, Building2,
  ListChecks, Eye, MessageSquare, CreditCard, GitPullRequest, RotateCcw,
  BookOpen, Activity, Phone, Lock, DollarSign, CheckCircle2, XCircle,
  Stamp, Download, Upload, FileCheck, UserPlus, FilePlus, Megaphone,
  Banknote, Receipt, FileBarChart, Settings, RefreshCw, Sparkles, Workflow,
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
import {
  ActionQueueCard, ConfirmDialog, ReasonDialog, MultiChannelPreviewDialog,
  PdfPreviewDialog, DigiLockerDialog, BulkTransferDialog, ProgressDialog, RiskFlag,
} from "@/components/dashboard/ActionQueue";
import { RazorpayMock } from "@/components/finance/RazorpayMock";
import { useAccess } from "@/lib/access";
import {
  useAccessStore, useUsersStore, useAcademicStore, usePlacementStore,
  useFinanceStore, useCommStore, useComplianceStore,
} from "@/stores";
import {
  payFeeCascade, resolveAccessRequestCascade, verifyDocumentsCascade,
  issueCertificateCascade, verifyScholarshipCascade, approveAdmissionCascade,
  approveRefundCascade, processRefundCascade, approveWaiverCascade,
  sendFeeReminderCascade, blockExamAccessCascade, disburseScholarshipCascade,
  overrideEligibilityCascade, lockMarksCascade, publishResultsCascade,
  nadPushCascade, reviewAiInterviewCascade, sendDriveReminderCascade,
  sendNudgeCascade, sendDeptAlertCascade, uploadMaterialCascade, optInWhatsappCascade,
} from "@/lib/cascade";
import { ROLE_LABEL } from "@/lib/types";
import type { User, AccessRequest } from "@/lib/types";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LearnNowX" }] }),
  component: DashboardRouter,
});

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const lakhs = (n: number) => `₹${(n / 100000).toFixed(2)}L`;

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
          case "lab_faculty": return <FacultyDashboard isLab />;
          case "student": return <StudentDashboard />;
          case "parent": return <ParentDashboard />;
          default: return <GenericDashboard />;
        }
      })()}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// HOI / DIRECTOR — Executive cockpit
// ════════════════════════════════════════════════════════════════════════
import {
  PeriodSelector, type Period, PERIOD_LABEL, periodFactor,
  ExplainDialog, type ExplainRow,
  AssignTaskDialog, ExportReportDialog, SegmentedAnnounceDialog,
  RetentionWidget, type AtRiskStudent,
  DeadlinesCalendar, type DeadlineItem,
  AqarDraftDialog,
} from "@/components/dashboard/HoiWidgets";
import { useDashApprovalStore } from "@/stores/dashboardApprovals";
import { DepartmentDrawer, FunnelStageDrawer, NaacCriterionDrawer, type DeptRow, type FunnelStage, type NaacCrit } from "@/components/dashboard/DrillDowns";

function HoiDashboard() {
  const { user } = useAccess();
  const requests = useAccessStore(s => s.requests).filter(r => r.status === "pending");
  const audit = useAccessStore(s => s.audit).slice(0, 8);
  const addAudit = useAccessStore(s => s.addAudit);
  const users = useUsersStore(s => s.users);
  const criteria = useComplianceStore(s => s.criteria);
  const ledger = useFinanceStore(s => s.ledger);
  const navigate = useNavigate();

  const decisions = useDashApprovalStore(s => s.decisions);
  const dismissedFlags = useDashApprovalStore(s => s.dismissedFlags);
  const decide = useDashApprovalStore(s => s.decide);
  const dismissFlag = useDashApprovalStore(s => s.dismissFlag);

  const students = users.filter(u => u.role === "student");
  const faculty = users.filter(u => ["faculty","lab_faculty","hod"].includes(u.role));
  const parents = users.filter(u => u.role === "parent");
  const naacReadiness = Math.round(criteria.reduce((a, c) => a + c.readiness, 0) / Math.max(criteria.length, 1));
  const departments = Array.from(new Set(users.map(u => u.department).filter(Boolean) as string[]));
  const batches = Array.from(new Set(students.map(s => s.batch).filter(Boolean) as string[]));

  // ── Period selector (cascades through KPI math) ────────────────────────
  const [period, setPeriod] = useState<Period>("month");
  const pf = periodFactor(period);

  // Single source of truth for department rows (used by table + attendance mean)
  const DEPT_DATA = useMemo(() => ([
    { code: "CSE", att: 94, plc: 82 },
    { code: "ECE", att: 90, plc: 76 },
    { code: "ME",  att: 68, plc: 58 },
    { code: "CIVIL", att: 87, plc: 65 },
    { code: "BIOTECH", att: 91, plc: 48 },
  ] as const).map(d => {
    const enrol = Math.max(1, students.filter(s => s.department === d.code).length);
    const health: "green" | "amber" | "red" =
      d.att >= 85 && d.plc >= 70 ? "green"
      : d.att < 75 || d.plc < 55 ? "red"
      : "amber";
    return { ...d, enrol, health };
  }), [students]);

  // Approval queues — seeded once, decisions persisted in store
  const baseQueues = useMemo(() => ({
    access: requests, // every pending access-control request (reconciles the top-bar badge)
    waivers: [
      { id: "wv1", userId: "u_stu_002", requestedBy: "u_registrar", requestedAt: new Date(Date.now()-2*864e5).toISOString(), change: "Fee waiver 30%", reason: "Single-parent income certificate verified", status: "pending" as const },
      { id: "wv2", userId: "u_stu_005", requestedBy: "u_registrar", requestedAt: new Date(Date.now()-3*864e5).toISOString(), change: "Fee waiver 50%", reason: "EWS category, family income < 2.5L", status: "pending" as const },
      { id: "wv3", userId: "u_stu_008", requestedBy: "u_registrar", requestedAt: new Date(Date.now()-1*864e5).toISOString(), change: "Fee waiver 25%", reason: "Sibling concession", status: "pending" as const },
    ],
    refunds: [
      { id: "rf1", userId: "u_stu_003", requestedBy: "u_finance", requestedAt: new Date(Date.now()-1*864e5).toISOString(), change: "Refund ₹75,000", reason: "Transfer to another institute", status: "pending" as const },
      { id: "rf2", userId: "u_stu_006", requestedBy: "u_finance", requestedAt: new Date(Date.now()-2*864e5).toISOString(), change: "Refund ₹62,500", reason: "Excess fee paid", status: "pending" as const },
    ],
    visibility: [
      { id: "vs1", userId: "u_hod_cse", requestedBy: "u_hod_cse", requestedAt: new Date(Date.now()-4*864e5).toISOString(), change: "Cross-dept visibility: ECE attendance", reason: "Joint research project planning", status: "pending" as const },
      { id: "vs2", userId: "u_fac_anjali", requestedBy: "u_fac_anjali", requestedAt: new Date(Date.now()-5*864e5).toISOString(), change: "View ME placement data", reason: "Inter-disciplinary case study", status: "pending" as const },
    ],
    scholarship: [
      { id: "sc1", userId: "u_stu_007", requestedBy: "u_registrar", requestedAt: new Date(Date.now()-1*864e5).toISOString(), change: "Escalation: NSP scholarship denied", reason: "Re-evaluation requested by parent", status: "pending" as const },
    ],
  }), [requests]);

  // Apply decisions
  const filterDecided = <T extends { id: string }>(arr: T[]) => arr.filter(r => !decisions[r.id]);
  const queues = {
    access: filterDecided(baseQueues.access),
    waivers: filterDecided(baseQueues.waivers),
    refunds: filterDecided(baseQueues.refunds),
    visibility: filterDecided(baseQueues.visibility),
    scholarship: filterDecided(baseQueues.scholarship),
  };
  const totalPending = queues.access.length + queues.waivers.length + queues.refunds.length + queues.visibility.length + queues.scholarship.length;

  const [tab, setTab] = useState<keyof typeof queues>("access");
  const tabData = queues[tab];

  // Dialog state
  const [confirmReq, setConfirmReq] = useState<AccessRequest | null>(null);
  const [rejectReq, setRejectReq] = useState<AccessRequest | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [aqarOpen, setAqarOpen] = useState(false);
  const [alertDept, setAlertDept] = useState<string | null>(null);
  const [explainKey, setExplainKey] = useState<null | "students" | "faculty" | "attendance" | "collection" | "placement" | "naac">(null);
  const [assignFlag, setAssignFlag] = useState<null | { defaultTitle: string; source: string }>(null);
  const [deptDrawer, setDeptDrawer] = useState<DeptRow | null>(null);
  const [funnelDrawer, setFunnelDrawer] = useState<FunnelStage | null>(null);
  const [critDrawer, setCritDrawer] = useState<NaacCrit | null>(null);

  // ── KPI numerics (period-cascaded where it makes sense) ────────────────
  const monthCollection = Math.round(2180000 * pf);
  const ytdCollection = 10500000;
  const todaysAttendance = period === "today" ? 91 : period === "week" ? 90 : period === "month" ? 89 : 88;
  const placementPct = 76;

  const sparks = {
    students: [128, 130, 133, 136, 138, students.length],
    faculty: [24, 25, 25, 26, 26, faculty.length],
    attendance: [86, 88, 90, 89, 91, todaysAttendance],
    collection: [16, 18, 19, 20, 21, Math.round(monthCollection / 100000)],
    placement: [62, 66, 70, 73, 74, placementPct],
    naac: [62, 65, 70, 73, 76, naacReadiness],
  };

  // Risk flags model — supports Dismiss + Assign
  type Flag = { id: string; tone: "red" | "amber"; icon: any; title: string; href: string; primary?: { label: string; onClick: () => void } };
  const allFlags: Flag[] = [
    { id: "rf_me_att", tone: "red", icon: AlertTriangle, title: "ME Dept attendance fell to 68% (below threshold)", href: "/academic/attendance",
      primary: { label: "Send alert to HOD Rohan", onClick: () => setAlertDept("ME") } },
    { id: "rf_dues", tone: "amber", icon: Wallet, title: "₹8,17,489 dues from 14 students (4 critical)", href: "/finance/defaulters",
      primary: { label: "Open Defaulters", onClick: () => navigate({ to: "/finance/defaulters" }) } },
    { id: "rf_naac_c3", tone: "amber", icon: ShieldCheck, title: "NAAC C3 (Research) at 42% — AQAR due in 38 days", href: "/compliance/naac",
      primary: { label: "Open Criterion 3", onClick: () => navigate({ to: "/compliance/naac" }) } },
    { id: "rf_workload", tone: "amber", icon: Users, title: "Faculty Dr. Mishra workload 28% over policy", href: "/people/faculty",
      primary: { label: "Open Workload", onClick: () => navigate({ to: "/people/faculty" }) } },
    { id: "rf_aicte", tone: "red", icon: Stamp, title: "AICTE EoA submission due in 62 days", href: "/compliance/aicte",
      primary: { label: "Open AICTE", onClick: () => navigate({ to: "/compliance/aicte" }) } },
  ];
  const flags = allFlags.filter(f => !dismissedFlags[f.id]);

  // At-risk students (driven by seed)
  const atRisk: AtRiskStudent[] = students
    .filter(s => (s.attendancePct ?? 100) < 75 || (s.backlogs ?? 0) >= 2)
    .slice(0, 8)
    .map(s => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      reason: (s.attendancePct ?? 100) < 65 ? `Attendance ${s.attendancePct}%` :
              (s.backlogs ?? 0) >= 3 ? `${s.backlogs} backlogs` :
              (s.attendancePct ?? 100) < 75 ? `Attendance ${s.attendancePct}%` : `${s.backlogs} backlogs`,
      severity: (s.attendancePct ?? 100) < 65 || (s.backlogs ?? 0) >= 3 ? "critical" : "watch",
      href: `/people/students/${s.id}`,
    }));
  const retentionPct = Math.round((1 - atRisk.length / Math.max(students.length, 1)) * 100);

  // Compliance & deadline calendar
  const deadlines: DeadlineItem[] = [
    { id: "d_aqar", label: "AQAR submission (NAAC)", date: addDaysSafe(38), module: "NAAC", href: "/compliance/naac" },
    { id: "d_eoa", label: "AICTE EoA filing", date: addDaysSafe(62), module: "AICTE", href: "/compliance/aicte" },
    { id: "d_nba_sar", label: "NBA SAR (Tier-II) draft", date: addDaysSafe(94), module: "NBA", href: "/compliance/nba" },
    { id: "d_exam_lock", label: "Sem-end results lock", date: addDaysSafe(14), module: "Exams", href: "/academic/results" },
    { id: "d_nirf", label: "NIRF data submission window", date: addDaysSafe(120), module: "NIRF", href: "/compliance/nirf" },
  ];

  // ── Approve / Reject handlers (persist + audit + toast + notify) ───────
  const handleApprove = (req: AccessRequest, comment: string) => {
    // If this is a real access request, run the cascade; otherwise just decide locally
    const isAccess = baseQueues.access.some(r => r.id === req.id);
    if (isAccess) {
      resolveAccessRequestCascade(req.id, "approved", comment, user!.id);
    } else {
      decide({ reqId: req.id, decision: "approved", note: comment, byUserId: user!.id, at: new Date().toISOString() });
      addAudit({
        id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(),
        actorId: user!.id, module: "Approvals", action: `approve.${tab}`,
        targetId: req.id, reason: `${req.change} · ${comment || "no comment"}`,
      });
    }
    toast.success("Approved", { description: req.change });
  };
  const handleReject = (req: AccessRequest, reason: string) => {
    const isAccess = baseQueues.access.some(r => r.id === req.id);
    if (isAccess) {
      resolveAccessRequestCascade(req.id, "rejected", reason, user!.id);
    } else {
      decide({ reqId: req.id, decision: "rejected", note: reason, byUserId: user!.id, at: new Date().toISOString() });
      addAudit({
        id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(),
        actorId: user!.id, module: "Approvals", action: `reject.${tab}`,
        targetId: req.id, reason: `${req.change} · ${reason}`,
      });
    }
    toast("Rejected", { description: req.change });
  };

  // Explain data builders
  const explainRows: Record<string, { title: string; formula: string; rows: ExplainRow[]; source: string }> = {
    students: {
      title: "Active Students", formula: "count(users where role=student AND status=active)",
      rows: [
        { label: "Total students", value: String(students.length) },
        { label: "Active", value: String(students.filter(s => s.status === "active").length), tone: "good" },
        { label: "Pending admission", value: String(students.filter(s => s.status === "pending").length), tone: "warn" },
        { label: "Inactive", value: String(students.filter(s => s.status === "inactive").length) },
      ],
      source: "People → Students (SIS)",
    },
    faculty: {
      title: "Faculty Strength", formula: "filled / sanctioned (AICTE)",
      rows: [
        { label: "Filled positions", value: `${faculty.length}` },
        { label: "Sanctioned (AICTE)", value: "30" },
        { label: "Vacant", value: String(30 - faculty.length), tone: "warn" },
        { label: "Projected FSR", value: "1:18", tone: "good" },
      ],
      source: "People → Faculty + AICTE sanctioned intake",
    },
    attendance: {
      title: "Today's Attendance", formula: "Σ present / Σ enrolled across all scheduled periods",
      rows: [
        { label: "Periods conducted", value: "42" },
        { label: "Present", value: `${Math.round(students.length * 0.91)} of ${students.length}` },
        { label: "Below 75% (cumulative)", value: `${atRisk.filter(a => a.reason.startsWith("Attendance")).length}`, tone: "warn" },
        { label: "Policy threshold", value: "75%" },
      ],
      source: "Academic → Attendance",
    },
    collection: {
      title: `Collection (${PERIOD_LABEL[period]})`, formula: "Σ paid receipts in selected period",
      rows: [
        { label: "Period", value: PERIOD_LABEL[period] },
        { label: "Collected", value: lakhs(monthCollection), tone: "good" },
        { label: "YTD", value: lakhs(ytdCollection) },
        { label: "Outstanding", value: "₹8,17,489", tone: "warn" },
      ],
      source: "Finance → Ledger",
    },
    placement: {
      title: "Placement YTD", formula: "placed / (eligible final-year)",
      rows: [
        { label: "Eligible (final year)", value: "118" },
        { label: "Placed", value: `${Math.round(118 * 0.76)}`, tone: "good" },
        { label: "Target (policy)", value: "76%" },
        { label: "Avg package", value: "₹6.4 LPA" },
      ],
      source: "Placement → Offers · policy threshold",
    },
    naac: {
      title: "NAAC Readiness", formula: "avg(readiness across 7 criteria)",
      rows: criteria.map(c => ({ label: `C${c.number} ${c.name ?? ""}`, value: `${c.readiness}%`, tone: c.readiness >= 80 ? "good" : c.readiness >= 60 ? "warn" : "bad" })),
      source: "Compliance → NAAC",
    },
  };

  const candidates = users.filter(u => ["hod","registrar","faculty","tpo_head","finance_head"].includes(u.role));

  return (
    <>
      <DashboardHero user={user!} kpis={
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <PeriodSelector value={period} onChange={setPeriod} />
            <span className="text-xs text-muted-foreground">KPIs cascade with selected period</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Link to="/people/students">
              <KpiCard label="Active Students" value={students.length} icon={GraduationCap}
                delta={{ value: "+12", up: true }} spark={sparks.students}
                target={{ value: 150, label: "150 capacity", current: students.length }}
                status={students.length >= 140 ? "on-track" : "watch"}
                onExplain={() => setExplainKey("students")} />
            </Link>
            <Link to="/people/faculty">
              <KpiCard label="Faculty Strength" value={`${faculty.length}/30`} icon={Users}
                delta={{ value: `${30 - faculty.length} vacant`, up: false }} spark={sparks.faculty}
                target={{ value: 30, label: "30 sanctioned", current: faculty.length }}
                status={faculty.length >= 28 ? "on-track" : faculty.length >= 25 ? "watch" : "breach"}
                onExplain={() => setExplainKey("faculty")} />
            </Link>
            <Link to="/academic/attendance">
              <KpiCard label="Today's Attendance" value={`${todaysAttendance}%`} icon={Activity} tone="teal"
                spark={sparks.attendance} target={{ value: 90, label: "≥ 90%", current: todaysAttendance }}
                status={todaysAttendance >= 90 ? "on-track" : todaysAttendance >= 80 ? "watch" : "breach"}
                onExplain={() => setExplainKey("attendance")} />
            </Link>
            <Link to="/finance/ledger">
              <KpiCard label={`${PERIOD_LABEL[period]} Collection`} value={lakhs(monthCollection)} icon={Wallet}
                delta={{ value: `YTD ${lakhs(ytdCollection)}`, up: true }} spark={sparks.collection}
                target={{ value: 25, label: `${period === "month" ? "₹25L/mo" : "period target"}`, current: Math.round(monthCollection / 100000) }}
                status={monthCollection >= 2000000 * pf ? "on-track" : "watch"}
                onExplain={() => setExplainKey("collection")} />
            </Link>
            <Link to="/placement/offers">
              <KpiCard label="Placement YTD" value={`${placementPct}%`} icon={Briefcase} tone="amber"
                spark={sparks.placement} target={{ value: 76, label: "76% policy", current: placementPct }}
                status={placementPct >= 76 ? "on-track" : placementPct >= 70 ? "watch" : "breach"}
                onExplain={() => setExplainKey("placement")} />
            </Link>
            <Link to="/compliance/naac">
              <KpiCard label="NAAC Readiness" value={`${naacReadiness}%`} icon={ShieldCheck}
                tone={naacReadiness >= 80 ? "teal" : "amber"} spark={sparks.naac}
                target={{ value: 80, label: "≥ 80% to file", current: naacReadiness }}
                status={naacReadiness >= 80 ? "on-track" : naacReadiness >= 60 ? "watch" : "breach"}
                onExplain={() => setExplainKey("naac")} />
            </Link>
          </div>
        </>
      } />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Section title="Pending Approvals" action={<Badge variant="outline" className="border-lnx-red-500/30 bg-lnx-red-500/5 text-lnx-red-500">{totalPending} pending</Badge>}>
            <Card className="overflow-hidden">
              <div className="flex flex-wrap gap-1 border-b bg-muted/30 px-3 py-2">
                {[
                  { id: "access", label: "Access Requests", n: queues.access.length },
                  { id: "waivers", label: "Fee Waivers", n: queues.waivers.length },
                  { id: "refunds", label: "Refunds >₹50K", n: queues.refunds.length },
                  { id: "visibility", label: "Cross-Dept", n: queues.visibility.length },
                  { id: "scholarship", label: "Scholarship Esc.", n: queues.scholarship.length },
                ].map(t => (
                  <button key={t.id} onClick={() => setTab(t.id as any)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${tab === t.id ? "bg-lnx-teal-500 text-white" : "text-muted-foreground hover:bg-accent"}`}>
                    {t.label} <span className="ml-1 rounded bg-black/10 px-1">{t.n}</span>
                  </button>
                ))}
              </div>
              {tabData.length === 0 ? (
                <div className="p-8"><EmptyState title="All clear" body="No items in this queue right now." /></div>
              ) : (
                <ul className="divide-y">
                  {tabData.map(req => {
                    const requestor = users.find(u => u.id === req.requestedBy);
                    return (
                      <li key={req.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          {requestor && <Avatar firstName={requestor.firstName} lastName={requestor.lastName} color={requestor.avatarColor} initials={requestor.initials} size="sm" />}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-lnx-navy-800">{req.change}</p>
                            <p className="truncate text-xs text-muted-foreground">{requestor?.firstName} {requestor?.lastName} · {req.reason}</p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(req.requestedAt), { addSuffix: true })}</p>
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 gap-1">
                          <Button size="sm" onClick={() => setConfirmReq(req)} className="h-7 bg-lnx-teal-500 text-xs text-white hover:bg-lnx-teal-500/90">Approve</Button>
                          <Button size="sm" variant="ghost" onClick={() => setRejectReq(req)} className="h-7 text-xs">Reject</Button>
                          <Button size="sm" variant="ghost" onClick={() => {
                            const map: Record<string, any> = { access: "/admin/access-control/requests", waivers: "/finance/budget", refunds: "/finance/ledger", visibility: "/admin/access-control/requests", scholarship: "/finance/scholarships" };
                            navigate({ to: map[tab] ?? "/admin/access-control/requests" });
                          }} className="h-7 text-xs">Details</Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </Section>

          <Section title="Quick Actions">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
              <QuickAction icon={Megaphone} label="Send Announcement" tone="primary" onClick={() => setAnnounceOpen(true)} />
              <QuickAction icon={UserPlus} label="Add User" href="/admin/access-control/people" />
              <QuickAction icon={FileBarChart} label="Export Institution Report" onClick={() => setExportOpen(true)} />
              <QuickAction icon={ScrollText} label="Review Audit Log" href="/admin/audit-log" />
              <QuickAction icon={Settings} label="Settings" href="/admin/settings" />
            </div>
          </Section>
        </div>

        <Section title="Risk Flags" className="space-y-2">
          {flags.length === 0 ? (
            <div className="rounded-lg border bg-card p-6 text-center text-xs text-muted-foreground">All flags dismissed</div>
          ) : flags.map(f => (
            <RiskFlag key={f.id} tone={f.tone} icon={f.icon} title={f.title}
              onClick={() => navigate({ to: f.href })}
              action={
                <div className="flex flex-col items-end gap-1">
                  {f.primary && (
                    <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={(e) => { e.stopPropagation(); f.primary!.onClick(); }}>
                      {f.primary.label}
                    </Button>
                  )}
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px]" onClick={(e) => { e.stopPropagation(); setAssignFlag({ defaultTitle: f.title, source: `risk-flag:${f.id}` }); }}>
                      Assign
                    </Button>
                    <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px]" onClick={(e) => {
                      e.stopPropagation();
                      dismissFlag(f.id);
                      addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user!.id, module: "Dashboard", action: "flag.dismiss", targetId: f.id, reason: f.title });
                      toast("Flag dismissed", { description: f.title });
                    }}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              } />
          ))}
        </Section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Admission Funnel</h3>
            <Badge variant="outline" className="text-xs">27.6%</Badge>
          </div>
          <ul className="space-y-1.5">
            {[
              ["Inquired",340,100,"inquired"],["Counselled",218,64,"counselled"],
              ["Applied",187,55,"applied"],["Documents",142,42,"documents"],
              ["Approved",118,35,"approved"],["Enrolled",94,28,"enrolled"],
            ].map(([l,v,w,stage]) => (
              <li key={l as string}>
                <button
                  onClick={() => setFunnelDrawer({ label: l as string, count: v as number, conv: w as number, stage: stage as string })}
                  className="w-full space-y-0.5 rounded px-1 py-0.5 text-left hover:bg-accent"
                >
                  <div className="flex justify-between text-[11px]"><span>{l as string}</span><span className="font-medium">{v as number}</span></div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-lnx-teal-500" style={{ width: `${w as number}%` }} /></div>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-muted-foreground">Click a stage to see the cohort and drop-off reasons.</p>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Department Performance</h3>
            <Link to="/people/faculty" className="text-xs text-lnx-teal-500 hover:underline">View all</Link>
          </div>
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase text-muted-foreground"><tr><th className="text-left pb-1">Dept</th><th className="text-right pb-1">Att%</th><th className="text-right pb-1">Plc%</th><th className="text-right pb-1">Health</th></tr></thead>
            <tbody>
              {[["CSE",94,82,"green"],["ECE",90,76,"green"],["ME",68,58,"red"],["CIVIL",87,65,"amber"],["BIOTECH",91,48,"amber"]].map(([d,a,p,h]) => (
                <tr key={d as string} className="cursor-pointer border-t hover:bg-accent" onClick={() => setDeptDrawer({ code: d as string, att: a as number, plc: p as number, health: h as any })}>
                  <td className="py-1.5 font-medium underline-offset-2 hover:underline">{d as string}</td>
                  <td className="text-right">{a as number}%</td>
                  <td className="text-right">{p as number}%</td>
                  <td className="text-right"><span className={`inline-block h-2 w-2 rounded-full ${h === "green" ? "bg-lnx-green-500" : h === "amber" ? "bg-lnx-amber-500" : "bg-lnx-red-500"}`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">NAAC Criterion Status</h3>
          <div className="grid grid-cols-4 gap-2">
            {criteria.map(c => (
              <button key={c.id} type="button" onClick={() => setCritDrawer({ id: c.id, number: c.number, name: c.name, readiness: c.readiness, status: c.status })} className="flex flex-col items-center rounded-md border p-2 hover:bg-accent">
                <div className={`text-xs font-semibold ${c.status === "green" ? "text-lnx-green-500" : c.status === "amber" ? "text-lnx-amber-500" : "text-lnx-red-500"}`}>{c.readiness}%</div>
                <div className="text-[9px] text-center mt-0.5">C{c.number}</div>
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setAqarOpen(true)}>
            <Sparkles className="mr-1 h-3.5 w-3.5" />Generate AQAR Draft
          </Button>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RetentionWidget
          retentionPct={retentionPct}
          atRisk={atRisk}
          onOpen={(s) => navigate({ to: "/people/students/$id", params: { id: s.id } as any })}
        />
        <DeadlinesCalendar items={deadlines} />
      </div>

      <Section title="Recent Activity" className="mt-6">
        <Card className="overflow-hidden">
          <ul className="divide-y">
            {audit.slice(0,8).map(a => {
              const actor = users.find(u => u.id === a.actorId);
              const target = a.module === "Tasks" ? "/admin/audit-log"
                : a.module === "Approvals" ? "/admin/access-control/requests"
                : a.module === "NAAC" ? "/compliance/naac"
                : a.module === "Finance" ? "/finance/ledger"
                : "/admin/audit-log";
              return (
                <li key={a.id}>
                  <Link to={target} className="flex items-center justify-between px-4 py-2.5 text-xs hover:bg-accent">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="text-[10px]">{a.module}</Badge>
                      <span className="truncate"><strong>{actor?.firstName ?? "System"}</strong> · {a.action}</span>
                    </div>
                    <span className="flex-shrink-0 text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(a.at), { addSuffix: true })}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="border-t bg-muted/20 p-2 text-center">
            <Link to="/admin/audit-log" className="text-xs text-lnx-teal-500 hover:underline">View full audit log →</Link>
          </div>
        </Card>
      </Section>

      {/* Dialogs */}
      <ConfirmDialog
        open={!!confirmReq} onOpenChange={(v) => !v && setConfirmReq(null)}
        title={`Approve: ${confirmReq?.change}`}
        description={`Requestor: ${users.find(u => u.id === confirmReq?.requestedBy)?.firstName ?? ""} ${users.find(u => u.id === confirmReq?.requestedBy)?.lastName ?? ""}`}
        confirmLabel="Approve" withComment
        onConfirm={(c) => confirmReq && handleApprove(confirmReq, c)}
      />
      <ReasonDialog
        open={!!rejectReq} onOpenChange={(v) => !v && setRejectReq(null)}
        title={`Reject: ${rejectReq?.change}`}
        description="Provide a reason — this will be shared with the requestor."
        confirmLabel="Reject" tone="danger"
        onSubmit={(r) => rejectReq && handleReject(rejectReq, r)}
      />
      <MultiChannelPreviewDialog
        open={!!alertDept} onOpenChange={(v) => !v && setAlertDept(null)}
        title="Send alert to HOD"
        subject={`Attendance below threshold — ${alertDept}`}
        body={`Dear HOD,\n\nDepartment attendance has fallen to 68%, below the institutional threshold of 75%. Please review section-wise data and submit an action plan within 7 days.\n\nRegards,\nDirector's Office`}
        recipients={[{ id: "u_hod_me", name: "Prof. Rohan Pandey (HOD ME)" }]}
        defaultChannels={["email", "whatsapp"]}
        onSend={(ch) => { sendDeptAlertCascade("ME", "Attendance below threshold — action plan required", user!.id); toast.success("Alert sent", { description: `Via ${ch.join(", ")}` }); }}
      />
      <ExplainDialog
        open={!!explainKey} onOpenChange={(v) => !v && setExplainKey(null)}
        title={explainKey ? explainRows[explainKey].title : ""}
        formula={explainKey ? explainRows[explainKey].formula : ""}
        rows={explainKey ? explainRows[explainKey].rows : []}
        source={explainKey ? explainRows[explainKey].source : ""}
      />
      <AssignTaskDialog
        open={!!assignFlag} onOpenChange={(v) => !v && setAssignFlag(null)}
        defaultTitle={assignFlag?.defaultTitle ?? ""}
        source={assignFlag?.source ?? ""}
        candidates={candidates} byUserId={user!.id}
      />
      <ExportReportDialog
        open={exportOpen} onOpenChange={setExportOpen} period={period}
        onConfirm={(cfg) => {
          addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user!.id, module: "Reports", action: "report.export", reason: `${cfg.scope} · ${cfg.sections.length} sections · ${cfg.period} · ${cfg.format}` });
          toast.success("Institution report ready", { description: `${cfg.sections.length} sections · ${cfg.format.toUpperCase()} · ${PERIOD_LABEL[cfg.period]}` });
        }}
      />
      <SegmentedAnnounceDialog
        open={announceOpen} onOpenChange={setAnnounceOpen}
        users={users} byUserId={user!.id}
        departments={departments} batches={batches}
        onSend={(audience, channels, subject, _body, count) => {
          addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user!.id, module: "Comms", action: "announce.send", reason: `${subject} · ${count} recipients · ${channels.join(",")}` });
          toast.success("Announcement queued", { description: `${count} recipients · ${channels.join(", ")}` });
        }}
      />
      <AqarDraftDialog
        open={aqarOpen} onOpenChange={setAqarOpen}
        criteria={criteria.map(c => ({ id: c.id, number: Number(c.number) || 0, name: c.name, readiness: c.readiness }))}
        onCommit={() => {
          addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user!.id, module: "NAAC", action: "aqar.draft.commit", reason: "AQAR draft committed, IQAC notified" });
          toast.success("AQAR draft committed", { description: "IQAC notified for review" });
        }}
      />
      <DepartmentDrawer open={!!deptDrawer} onOpenChange={(v) => !v && setDeptDrawer(null)} dept={deptDrawer} />
      <FunnelStageDrawer open={!!funnelDrawer} onOpenChange={(v) => !v && setFunnelDrawer(null)} stage={funnelDrawer} />
      <NaacCriterionDrawer open={!!critDrawer} onOpenChange={(v) => !v && setCritDrawer(null)} crit={critDrawer} />
    </>
  );
}

// helper used above
function addDaysSafe(d: number) { const x = new Date(); x.setDate(x.getDate() + d); return x; }

// ════════════════════════════════════════════════════════════════════════
// REGISTRAR — Workflow inbox
// ════════════════════════════════════════════════════════════════════════
function RegistrarDashboard() {
  const { user } = useAccess();
  const users = useUsersStore(s => s.users);
  const students = users.filter(u => u.role === "student");
  const navigate = useNavigate();

  // Mock queues
  const [docQueue, setDocQueue] = useState(students.slice(0, 6).map((s, i) => ({
    id: `dq_${s.id}`, student: s,
    missing: ["10th Marksheet", "12th Marksheet", "Aadhaar", "Caste Cert"].slice(0, 1 + (i % 3)),
    apaar: i % 3 !== 0,
    daysWaiting: 1 + (i % 5),
  })));
  const [certQueue, setCertQueue] = useState(students.slice(6, 12).map((s, i) => ({
    id: `cq_${s.id}`, student: s,
    type: ["Bonafide Certificate","Transfer Certificate","Character Certificate","Internship NOC","Bonafide Certificate","Transfer Certificate"][i],
    reason: ["Passport application","Higher studies","Scholarship","Internship","Visa","College transfer"][i],
    feePaid: i % 2 === 0,
    daysWaiting: 1 + i,
  })));
  const [scholarQueue, setScholarQueue] = useState(students.slice(0, 4).map((s, i) => ({
    id: `sq_${s.id}`, student: s,
    scheme: ["NSP Post-Matric","State Merit","SC/ST Welfare","Minority Scholarship"][i],
    income: ["1.8L","2.4L","1.2L","2.0L"][i],
    category: ["OBC","General-EWS","SC","Minority"][i],
    daysWaiting: 2 + i,
  })));
  const [admissionQueue, setAdmissionQueue] = useState([
    { id: "ad1", name: "Arjun Mehta", program: "B.Tech CSE", docsOk: true, feePaid: true, rank: 423 },
    { id: "ad2", name: "Priyanka Reddy", program: "B.Tech ECE", docsOk: true, feePaid: true, rank: 612 },
    { id: "ad3", name: "Karan Singh", program: "B.Tech ME", docsOk: true, feePaid: false, rank: 891 },
  ]);

  const [digiOpen, setDigiOpen] = useState<{ studentId: string; name: string } | null>(null);
  const [certPreview, setCertPreview] = useState<{ id: string; name: string; type: string } | null>(null);
  const [confirmScholar, setConfirmScholar] = useState<typeof scholarQueue[0] | null>(null);
  const [confirmAdmit, setConfirmAdmit] = useState<typeof admissionQueue[0] | null>(null);
  const [rejectScholar, setRejectScholar] = useState<typeof scholarQueue[0] | null>(null);
  const [nspOpen, setNspOpen] = useState(false);
  const [requestMsg, setRequestMsg] = useState<{ id: string; name: string } | null>(null);

  return (
    <>
      <DashboardHero user={user!} kpis={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="New Inquiries Today" value="12" icon={Bell} delta={{ value: "+3", up: true }} />
          <KpiCard label="Applications in Progress" value="48" icon={ClipboardList} tone="teal" />
          <KpiCard label="Documents to Verify" value={docQueue.length} icon={FileCheck} tone="amber" />
          <KpiCard label="Cert Requests Pending" value={certQueue.length} icon={FileText} />
        </div>
      } />

      <div className="space-y-4">
        <ActionQueueCard
          title="Documents to verify" count={docQueue.length} badgeTone="amber"
          emptyText="No pending document verifications"
          rows={docQueue}
          renderRow={(r) => (
            <div className="flex items-center gap-3">
              <Avatar firstName={r.student.firstName} lastName={r.student.lastName} color={r.student.avatarColor} initials={r.student.initials} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{r.student.firstName} {r.student.lastName}</p>
                <p className="text-xs text-muted-foreground">{r.student.rollNo ?? r.student.id}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {r.missing.map(m => <Badge key={m} variant="outline" className="h-4 text-[10px]">{m}</Badge>)}
                  {!r.apaar && <Badge variant="outline" className="h-4 border-lnx-amber-500/40 text-[10px] text-lnx-amber-500">No APAAR</Badge>}
                  <span className="text-[10px] text-muted-foreground">· {r.daysWaiting}d waiting</span>
                </div>
              </div>
            </div>
          )}
          actions={[
            { label: "Verify with DigiLocker", tone: "primary", icon: ShieldCheck, onClick: (r) => setDigiOpen({ studentId: r.student.id, name: `${r.student.firstName} ${r.student.lastName}` }) },
            { label: "Manual Upload", icon: Upload, onClick: (r) => {
              verifyDocumentsCascade(r.student.id, "Manual", user!.id);
              setDocQueue(q => q.filter(x => x.id !== r.id));
              toast.success(`Documents verified manually for ${r.student.firstName}`);
            }},
            { label: "Request from Student", icon: MessageSquare, onClick: (r) => setRequestMsg({ id: r.id, name: `${r.student.firstName} ${r.student.lastName}` }) },
          ]}
        />

        <ActionQueueCard
          title="Certificate requests" count={certQueue.length} badgeTone="amber"
          emptyText="No pending certificate requests"
          rows={certQueue}
          renderRow={(r) => (
            <div className="flex items-center gap-3">
              <Avatar firstName={r.student.firstName} lastName={r.student.lastName} color={r.student.avatarColor} initials={r.student.initials} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{r.student.firstName} {r.student.lastName} <span className="ml-1 text-xs font-normal text-muted-foreground">· {r.type}</span></p>
                <p className="text-xs text-muted-foreground">{r.reason} · {r.feePaid ? <span className="text-lnx-green-500">Fee paid</span> : <span className="text-lnx-amber-500">Fee due</span>} · {r.daysWaiting}d</p>
              </div>
            </div>
          )}
          actions={[
            { label: "Generate", tone: "primary", icon: FilePlus, onClick: (r) => setCertPreview({ id: r.id, name: `${r.student.firstName} ${r.student.lastName}`, type: r.type }) },
            { label: "Reject", tone: "danger", onClick: (r) => { setCertQueue(q => q.filter(x => x.id !== r.id)); toast(`Rejected — ${r.type}`); } },
          ]}
        />

        <ActionQueueCard
          title="Scholarship applications" count={scholarQueue.length}
          emptyText="No scholarship applications pending"
          rows={scholarQueue}
          renderRow={(r) => (
            <div className="flex items-center gap-3">
              <Avatar firstName={r.student.firstName} lastName={r.student.lastName} color={r.student.avatarColor} initials={r.student.initials} size="sm" />
              <div>
                <p className="text-sm font-medium">{r.student.firstName} {r.student.lastName} <span className="ml-1 text-xs font-normal text-muted-foreground">· {r.scheme}</span></p>
                <p className="text-xs text-muted-foreground">Income ₹{r.income} · {r.category} · {r.daysWaiting}d waiting</p>
              </div>
            </div>
          )}
          actions={[
            { label: "Approve", tone: "primary", onClick: (r) => setConfirmScholar(r) },
            { label: "Decline", tone: "danger", onClick: (r) => setRejectScholar(r) },
          ]}
        />

        <ActionQueueCard
          title="Admissions awaiting final approval" count={admissionQueue.length} badgeTone="amber"
          emptyText="No admissions awaiting final approval"
          rows={admissionQueue}
          renderRow={(r) => (
            <div>
              <p className="text-sm font-medium">{r.name} <span className="ml-1 text-xs font-normal text-muted-foreground">· {r.program}</span></p>
              <p className="text-xs text-muted-foreground">Merit rank #{r.rank} · {r.docsOk ? <span className="text-lnx-green-500">Docs ✓</span> : "Docs ✗"} · {r.feePaid ? <span className="text-lnx-green-500">Fee ✓</span> : <span className="text-lnx-amber-500">Fee pending</span>}</p>
            </div>
          )}
          actions={[
            { label: "Approve & Enrol", tone: "primary", icon: CheckCircle2, onClick: (r) => setConfirmAdmit(r) },
            { label: "Reject", tone: "danger", onClick: (r) => { setAdmissionQueue(q => q.filter(x => x.id !== r.id)); toast(`${r.name} application rejected`); } },
          ]}
        />

        <Section title="Quick Actions">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            <QuickAction icon={UserPlus} label="+ Add Inquiry" tone="primary" onClick={() => toast.success("Inquiry drawer opened (demo)")} />
            <QuickAction icon={FilePlus} label="+ Manual Application" onClick={() => toast.success("Application drawer opened (demo)")} />
            <QuickAction icon={ShieldCheck} label="Bulk Document Verify" onClick={() => toast.success("Bulk verify started for 12 students")} />
            <QuickAction icon={RefreshCw} label="NSP Sync" onClick={() => setNspOpen(true)} />
            <QuickAction icon={Megaphone} label="Send Announcement" href="/communication/announcements" />
          </div>
        </Section>
      </div>

      <DigiLockerDialog open={!!digiOpen} onOpenChange={(v) => !v && setDigiOpen(null)}
        studentName={digiOpen?.name ?? ""}
        onVerified={() => {
          if (!digiOpen) return;
          verifyDocumentsCascade(digiOpen.studentId, "DigiLocker", user!.id);
          setDocQueue(q => q.filter(x => x.student.id !== digiOpen.studentId));
          toast.success(`DigiLocker fetch complete for ${digiOpen.name}`);
        }} />
      <PdfPreviewDialog
        open={!!certPreview} onOpenChange={(v) => !v && setCertPreview(null)}
        title="Issue Certificate" docType={certPreview?.type ?? ""} recipient={certPreview?.name ?? ""}
        fields={[{ label: "Issue Date", value: format(new Date(), "dd MMM yyyy") }, { label: "Validity", value: "6 months" }]}
        onConfirm={() => {
          if (!certPreview) return;
          const student = certQueue.find(c => c.id === certPreview.id)?.student;
          if (student) issueCertificateCascade(student.id, certPreview.type, user!.id);
          setCertQueue(q => q.filter(x => x.id !== certPreview.id));
          toast.success(`${certPreview.type} issued to ${certPreview.name}`);
        }}
      />
      <ConfirmDialog open={!!confirmScholar} onOpenChange={(v) => !v && setConfirmScholar(null)}
        title={`Approve scholarship: ${confirmScholar?.scheme}`}
        description={`${confirmScholar?.student.firstName} ${confirmScholar?.student.lastName} · Income ₹${confirmScholar?.income}`}
        confirmLabel="Approve & Send to Finance" withComment
        onConfirm={(c) => {
          if (!confirmScholar) return;
          verifyScholarshipCascade(confirmScholar.student.id, confirmScholar.scheme, user!.id);
          setScholarQueue(q => q.filter(x => x.id !== confirmScholar.id));
          toast.success(`Scholarship verified · sent to Finance Head's queue`);
        }} />
      <ReasonDialog open={!!rejectScholar} onOpenChange={(v) => !v && setRejectScholar(null)}
        title="Decline scholarship application" description="Reason will be sent to student"
        confirmLabel="Decline"
        onSubmit={(r) => { if (!rejectScholar) return; setScholarQueue(q => q.filter(x => x.id !== rejectScholar.id)); toast(`Declined — ${rejectScholar.scheme}`, { description: r }); }} />
      <ConfirmDialog open={!!confirmAdmit} onOpenChange={(v) => !v && setConfirmAdmit(null)}
        title={`Approve & Enrol: ${confirmAdmit?.name}`}
        description={`${confirmAdmit?.program} · Roll no will be allocated automatically`}
        confirmLabel="Enrol Student" withComment
        onConfirm={() => {
          if (!confirmAdmit) return;
          approveAdmissionCascade(confirmAdmit.name, confirmAdmit.program, user!.id);
          setAdmissionQueue(q => q.filter(x => x.id !== confirmAdmit.id));
          toast.success(`${confirmAdmit.name} enrolled in ${confirmAdmit.program}`, { description: "Welcome email queued · HOD notified" });
        }} />
      <ProgressDialog open={nspOpen} onOpenChange={setNspOpen}
        title="NSP Sync" description="Pushing verified scholarships to National Scholarship Portal…"
        durationMs={2400} successText="9 records synced · 0 errors"
        onComplete={() => toast.success("NSP sync complete", { description: "9 students pushed" })} />
      <MultiChannelPreviewDialog
        open={!!requestMsg} onOpenChange={(v) => !v && setRequestMsg(null)}
        title="Request documents from student"
        subject="Please upload pending documents"
        body={`Dear student,\n\nThe Registrar's office requires the following documents to complete your file. Please upload them via your student portal within 5 working days.\n\nRegards,\nRegistrar — Bharat Institute`}
        recipients={requestMsg ? [{ id: requestMsg.id, name: requestMsg.name }] : []}
        defaultChannels={["email","sms"]}
        onSend={(ch) => toast.success(`Document request sent`, { description: `Via ${ch.join(", ")}` })}
      />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// TPO HEAD — Sales CRM
// ════════════════════════════════════════════════════════════════════════
function TpoDashboard() {
  const { user } = useAccess();
  const drives = usePlacementStore(s => s.drives);
  const companies = usePlacementStore(s => s.companies);
  const ai = usePlacementStore(s => s.ai);
  const offers = usePlacementStore(s => s.offers);
  const users = useUsersStore(s => s.users);
  const students = users.filter(u => u.role === "student");
  const navigate = useNavigate();

  const activeDrives = drives.filter(d => d.status === "active" || d.status === "upcoming").slice(0, 4);
  const [reviewQueue, setReviewQueue] = useState(ai.slice(0, 6).map((a, i) => ({
    ...a, id: a.id || `air_${i}`, daysWaiting: 1 + (i % 4),
    studentObj: students.find(s => s.id === a.studentId) ?? students[i],
    driveObj: drives.find(d => d.id === a.driveId) ?? drives[0],
  })));
  const [inactiveStudents, setInactiveStudents] = useState(students.slice(0, 6).map((s, i) => ({
    id: `in_${s.id}`, student: s, branch: s.department ?? "CSE",
    lastActivity: `${7 + i} days ago`,
    profile: ["SDE","Data Analyst","Frontend Dev","Business Analyst","Product","DevOps"][i % 6],
  })));

  const [reminderDrive, setReminderDrive] = useState<typeof activeDrives[0] | null>(null);
  const [cancelDrive, setCancelDrive] = useState<typeof activeDrives[0] | null>(null);
  const [reviewItem, setReviewItem] = useState<typeof reviewQueue[0] | null>(null);
  const [nudgeStudent, setNudgeStudent] = useState<typeof inactiveStudents[0] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [mcqGenOpen, setMcqGenOpen] = useState(false);

  return (
    <>
      <DashboardHero user={user!} kpis={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Link to="/placement/drives"><KpiCard label="Active Drives" value={activeDrives.length} icon={Briefcase} tone="teal" /></Link>
          <Link to="/placement/companies"><KpiCard label="Companies YTD" value={companies.length} icon={Building2} /></Link>
          <Link to="/placement/offers"><KpiCard label="Placed YTD" value={offers.filter(o => o.status === "accepted").length} icon={BadgeCheck} delta={{ value: "+18% vs LY", up: true }} /></Link>
          <KpiCard label="Avg Package" value="₹7.2 LPA" icon={TrendingUp} tone="amber" />
          <KpiCard label="AI Test Completion" value="62%" icon={Bot} />
        </div>
      } />

      <Section title="Drives This Week" action={<Button size="sm" onClick={() => setCreateOpen(true)} className="bg-lnx-teal-500 text-white hover:bg-lnx-teal-500/90"><Plus className="mr-1 h-3.5 w-3.5" />Create Drive</Button>}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {activeDrives.map(d => {
            const co = companies.find(c => c.id === d.companyId);
            return (
              <Card key={d.id} className="p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-lnx-navy-800">{co?.name ?? "Company"}</p>
                    <p className="text-xs text-muted-foreground">{d.role} · {d.package}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(d.startDate), "dd MMM")} – {format(new Date(d.endDate), "dd MMM")}</p>
                  </div>
                  <Badge variant="outline" className={d.status === "active" ? "border-lnx-teal-500/30 text-lnx-teal-500" : "border-lnx-amber-500/30 text-lnx-amber-500"}>
                    {d.status}
                  </Badge>
                </div>
                <div className="mb-3 grid grid-cols-5 gap-2 text-center text-xs">
                  {[["Elig",87],["App",d.appliedIds.length || 62],["Tested",48],["Short",d.shortlistedIds.length || 23],["Off",d.selectedIds.length]].map(([l,v]) => (
                    <div key={l as string}><div className="text-sm font-semibold">{v}</div><div className="text-[10px] text-muted-foreground">{l as string}</div></div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" onClick={() => navigate({ to: `/placement/drives/${d.id}` })} className="h-7 bg-lnx-teal-500 text-xs text-white hover:bg-lnx-teal-500/90">Manage</Button>
                  <Button size="sm" variant="outline" onClick={() => setReminderDrive(d)} className="h-7 text-xs"><Send className="mr-1 h-3 w-3" />Send Reminder</Button>
                  {d.selectedIds.length === 0 && <Button size="sm" variant="ghost" onClick={() => setCancelDrive(d)} className="h-7 text-xs text-lnx-red-500">Cancel</Button>}
                </div>
              </Card>
            );
          })}
        </div>
      </Section>

      <div className="mt-4 space-y-4">
        <ActionQueueCard
          title="Pending AI interview reviews" count={reviewQueue.length} badgeTone="amber"
          emptyText="All AI interviews reviewed"
          rows={reviewQueue}
          renderRow={(r) => (
            <div className="flex items-center gap-3">
              {r.studentObj && <Avatar firstName={r.studentObj.firstName} lastName={r.studentObj.lastName} color={r.studentObj.avatarColor} initials={r.studentObj.initials} size="sm" />}
              <div>
                <p className="text-sm font-medium">{r.studentObj?.firstName} {r.studentObj?.lastName}</p>
                <p className="text-xs text-muted-foreground">Auto score: <strong>{r.score}/100</strong> · {r.durationMins}m · {r.language} · {r.daysWaiting}d waiting</p>
              </div>
            </div>
          )}
          actions={[
            { label: "Review Recording", tone: "primary", icon: Eye, onClick: (r) => setReviewItem(r) },
            { label: "Approve Score", onClick: (r) => { reviewAiInterviewCascade(r.studentId, r.score, user!.id); setReviewQueue(q => q.filter(x => x.id !== r.id)); toast.success("Score approved · added to leaderboard"); } },
          ]}
        />

        <ActionQueueCard
          title="Students inactive 7+ days" count={inactiveStudents.length}
          emptyText="All students active"
          rows={inactiveStudents}
          renderRow={(r) => (
            <div className="flex items-center gap-3">
              <Avatar firstName={r.student.firstName} lastName={r.student.lastName} color={r.student.avatarColor} initials={r.student.initials} size="sm" />
              <div>
                <p className="text-sm font-medium">{r.student.firstName} {r.student.lastName} <span className="ml-1 text-xs font-normal text-muted-foreground">· {r.branch}</span></p>
                <p className="text-xs text-muted-foreground">Last active {r.lastActivity} · Profile: {r.profile}</p>
              </div>
            </div>
          )}
          actions={[
            { label: "Send Nudge", tone: "primary", icon: Send, onClick: (r) => setNudgeStudent(r) },
            { label: "Reassign Profile", onClick: (r) => { toast.success(`${r.student.firstName} reassigned to ${["SDE","Data Analyst","Product"][Math.floor(Math.random()*3)]}`); } },
          ]}
        />

        <Section title="Quick Actions">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            <QuickAction icon={Plus} label="+ Create Drive" tone="primary" onClick={() => setCreateOpen(true)} />
            <QuickAction icon={Building2} label="+ Add Company" onClick={() => toast.success("Add Company drawer (demo)")} />
            <QuickAction icon={Sparkles} label="Generate MCQs from JD" onClick={() => setMcqGenOpen(true)} />
            <QuickAction icon={Bot} label="Configure AI Interview" href="/placement/ai-interviews" />
            <QuickAction icon={Megaphone} label="Send Drive Announcement" href="/communication/announcements" />
          </div>
        </Section>
      </div>

      <MultiChannelPreviewDialog
        open={!!reminderDrive} onOpenChange={(v) => !v && setReminderDrive(null)}
        title={`Reminder: ${companies.find(c => c.id === reminderDrive?.companyId)?.name ?? "Drive"}`}
        subject={`Last chance to apply — ${companies.find(c => c.id === reminderDrive?.companyId)?.name ?? ""}`}
        body={`Dear student,\n\nThis is a reminder that the ${reminderDrive?.role} drive at ${companies.find(c => c.id === reminderDrive?.companyId)?.name} closes soon. Apply now via the placement portal.\n\nRegards,\nTPO`}
        recipients={students.slice(0, 25).map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}` }))}
        defaultChannels={["whatsapp","sms","email"]}
        onSend={(ch) => { reminderDrive && sendDriveReminderCascade(reminderDrive.id, ch, user!.id); toast.success(`Drive reminder sent to 25 students`, { description: `Via ${ch.join(", ")}` }); }}
      />
      <ReasonDialog
        open={!!cancelDrive} onOpenChange={(v) => !v && setCancelDrive(null)}
        title="Cancel drive" description="Reason will be sent to all applicants."
        confirmLabel="Cancel Drive" tone="danger"
        onSubmit={(r) => { toast(`Drive cancelled`, { description: r }); setCancelDrive(null); }}
      />
      <Dialog open={!!reviewItem} onOpenChange={(v) => !v && setReviewItem(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Interview Review — {reviewItem?.studentObj?.firstName} {reviewItem?.studentObj?.lastName}</DialogTitle>
            <DialogDescription>Auto score: {reviewItem?.score}/100 · {reviewItem?.durationMins} mins · {reviewItem?.language}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between text-xs"><span>Recording (mock)</span><span className="text-muted-foreground">12:34 / {reviewItem?.durationMins}:00</span></div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full w-1/3 bg-lnx-teal-500 rounded-full" /></div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {[
                ["Q1: Tell me about yourself", 78],
                ["Q2: STAR story — challenge", 65],
                ["Q3: Technical: SQL joins", 82],
                ["Q4: Behavioural: conflict", 71],
                ["Q5: Why this company?", 88],
              ].map(([q, s]) => (
                <div key={q as string} className="flex items-center justify-between rounded-md border p-2 text-xs">
                  <span className="truncate">{q as string}</span>
                  <div className="flex items-center gap-2">
                    <Input type="number" defaultValue={s as number} className="h-7 w-16 text-xs" min={0} max={100} />
                    <span className="text-muted-foreground">/100</span>
                  </div>
                </div>
              ))}
            </div>
            <Textarea placeholder="Reviewer notes (optional)" rows={2} className="text-xs" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReviewItem(null)}>Cancel</Button>
            <Button onClick={() => {
              if (!reviewItem) return;
              reviewAiInterviewCascade(reviewItem.studentId, reviewItem.score, user!.id);
              setReviewQueue(q => q.filter(x => x.id !== reviewItem.id));
              setReviewItem(null);
              toast.success("Review saved · leaderboard updated");
            }} className="bg-lnx-teal-500 text-white hover:bg-lnx-teal-500/90">Save Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <MultiChannelPreviewDialog
        open={!!nudgeStudent} onOpenChange={(v) => !v && setNudgeStudent(null)}
        title={`Nudge: ${nudgeStudent?.student.firstName}`}
        subject="Stay on track with your placement prep"
        body={`Hi ${nudgeStudent?.student.firstName},\n\nWe noticed you haven't practised MCQs or attempted an AI interview this week. Complete at least one practice session today to stay competitive.\n\nReply to this for help.\n\n— TPO Team`}
        recipients={nudgeStudent ? [{ id: nudgeStudent.student.id, name: `${nudgeStudent.student.firstName} ${nudgeStudent.student.lastName}` }] : []}
        defaultChannels={["whatsapp"]}
        onSend={(ch) => { if (!nudgeStudent) return; sendNudgeCascade(nudgeStudent.student.id, ch, user!.id); setInactiveStudents(q => q.filter(x => x.id !== nudgeStudent.id)); toast.success(`Nudge sent`, { description: `${nudgeStudent.student.firstName} · ${ch.join(", ")}` }); }}
      />
      <CreateDriveDialog open={createOpen} onOpenChange={setCreateOpen} actorId={user!.id} />
      <ProgressDialog open={mcqGenOpen} onOpenChange={setMcqGenOpen}
        title="Generating MCQs from Job Description" description="AI analysing JD · creating 20 questions…"
        durationMs={2800} successText="20 questions generated"
        onComplete={() => toast.success("20 MCQs generated", { description: "Saved to bank · ready to attach to any drive" })} />
    </>
  );
}

function CreateDriveDialog({ open, onOpenChange, actorId }: { open: boolean; onOpenChange: (v: boolean) => void; actorId: string }) {
  const companies = usePlacementStore(s => s.companies);
  const [company, setCompany] = useState(companies[0]?.id ?? "");
  const [role, setRole] = useState("Software Engineer");
  const [pkg, setPkg] = useState("₹8 LPA");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Drive</DialogTitle>
          <DialogDescription>Students will be notified once published.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Company</Label>
            <select className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm" value={company} onChange={(e) => setCompany(e.target.value)}>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><Label className="text-xs">Role</Label><Input value={role} onChange={(e) => setRole(e.target.value)} className="mt-1" /></div>
          <div><Label className="text-xs">Package</Label><Input value={pkg} onChange={(e) => setPkg(e.target.value)} className="mt-1" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-lnx-teal-500 text-white hover:bg-lnx-teal-500/90" onClick={() => {
            const newDrive = {
              id: `drv_${Date.now().toString(36)}`, companyId: company, role, package: pkg,
              branches: ["CSE","ECE"], cgpaCutoff: 7.0, backlogsAllowed: false,
              startDate: new Date(Date.now()+3*864e5).toISOString(),
              endDate: new Date(Date.now()+10*864e5).toISOString(),
              appliedIds: [], shortlistedIds: [], selectedIds: [],
              status: "upcoming" as const,
            };
            import("@/lib/cascade").then(m => m.createDriveCascade(newDrive, actorId));
            toast.success(`Drive created · ${companies.find(c => c.id === company)?.name}`, { description: "40 students notified" });
            onOpenChange(false);
          }}>Publish Drive</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ════════════════════════════════════════════════════════════════════════
// FINANCE HEAD — Accounting console
// ════════════════════════════════════════════════════════════════════════
function FinanceDashboard() {
  const { user } = useAccess();
  const users = useUsersStore(s => s.users);
  const students = users.filter(u => u.role === "student");
  const ledger = useFinanceStore(s => s.ledger);

  // Mock queues
  const [refunds, setRefunds] = useState([
    { id: "rf1", studentId: students[0]?.id ?? "u_stu_001", amount: 75000, reason: "Transfer to another institute", daysWaiting: 2, mode: "Razorpay", requestedBy: "Registrar" },
    { id: "rf2", studentId: students[1]?.id ?? "u_stu_002", amount: 62500, reason: "Excess fee paid", daysWaiting: 1, mode: "UPI", requestedBy: "Registrar" },
    { id: "rf3", studentId: students[2]?.id ?? "u_stu_003", amount: 48000, reason: "Hostel cancellation", daysWaiting: 4, mode: "NetBanking", requestedBy: "Registrar" },
  ]);
  const [waivers, setWaivers] = useState([
    { id: "wv1", studentId: students[3]?.id ?? "u_stu_004", pct: 30, reason: "Single-parent income certificate verified", daysWaiting: 2 },
    { id: "wv2", studentId: students[4]?.id ?? "u_stu_005", pct: 50, reason: "EWS category", daysWaiting: 3 },
    { id: "wv3", studentId: students[5]?.id ?? "u_stu_006", pct: 25, reason: "Sibling concession", daysWaiting: 1 },
  ]);
  const [processQueue, setProcessQueue] = useState([
    { id: "pq1", studentId: students[6]?.id ?? "u_stu_007", amount: 55000, approvedOn: "29 May 2026", bank: "HDFC ****4421" },
    { id: "pq2", studentId: students[7]?.id ?? "u_stu_008", amount: 40000, approvedOn: "30 May 2026", bank: "SBI ****9912" },
  ]);
  const [discrepancies] = useState([
    { id: "dc1", date: "01 Jun 2026", txnId: "pay_LKR7s89Hk", razorpay: 60000, ledger: 55000, diff: 5000 },
    { id: "dc2", date: "31 May 2026", txnId: "pay_HJK3mZ", razorpay: 30000, ledger: 30000, diff: 0 },
  ]);
  const [defaulters] = useState(students.slice(0, 6).map((s, i) => ({
    id: `df_${s.id}`, student: s, amount: 45000 + i * 8000, days: 12 + i * 4, lastReminder: i === 0 ? "Never" : `${i * 3}d ago`,
  })));

  const [confirmRefund, setConfirmRefund] = useState<typeof refunds[0] | null>(null);
  const [rejectRefund, setRejectRefund] = useState<typeof refunds[0] | null>(null);
  const [confirmWaiver, setConfirmWaiver] = useState<typeof waivers[0] | null>(null);
  const [rejectWaiver, setRejectWaiver] = useState<typeof waivers[0] | null>(null);
  const [transferOpen, setTransferOpen] = useState<typeof processQueue[0] | null>(null);
  const [reminderStudent, setReminderStudent] = useState<typeof defaulters[0] | null>(null);
  const [blockStudent, setBlockStudent] = useState<typeof defaulters[0] | null>(null);
  const [disburseOpen, setDisburseOpen] = useState(false);
  const [bulkReminderOpen, setBulkReminderOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [reconcileOpen, setReconcileOpen] = useState(false);

  const todayCollection = ledger.filter(l => l.payment).reduce((a, l) => a + (l.payment ?? 0), 0) + 285000;
  const totalDues = defaulters.reduce((a, d) => a + d.amount, 0);

  return (
    <>
      <DashboardHero user={user!} kpis={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Link to="/finance/ledger"><KpiCard label="Today's Collection" value={lakhs(todayCollection)} icon={Wallet} tone="teal" /></Link>
          <Link to="/finance/defaulters"><KpiCard label="Total Pending Dues" value={lakhs(totalDues)} icon={AlertTriangle} tone="amber" /></Link>
          <Link to="/finance/defaulters"><KpiCard label="Defaulters" value={defaulters.length} icon={Users} /></Link>
          <KpiCard label="Refunds Pending" value={refunds.length} icon={RotateCcw} />
          <KpiCard label="Reconciliation" value={discrepancies.filter(d => d.diff > 0).length === 0 ? "Clean" : `${discrepancies.filter(d => d.diff > 0).length} issues`} icon={GitPullRequest} tone={discrepancies.filter(d => d.diff > 0).length ? "amber" : "teal"} />
        </div>
      } />

      <div className="space-y-4">
        <ActionQueueCard
          title="Refunds awaiting approval" count={refunds.length} badgeTone="amber"
          emptyText="No refunds pending"
          rows={refunds}
          renderRow={(r) => {
            const stu = students.find(s => s.id === r.studentId);
            return (
              <div className="flex items-center gap-3">
                {stu && <Avatar firstName={stu.firstName} lastName={stu.lastName} color={stu.avatarColor} initials={stu.initials} size="sm" />}
                <div>
                  <p className="text-sm font-medium">{stu?.firstName} {stu?.lastName} <span className="ml-1 text-sm font-semibold text-lnx-navy-800">· ₹{r.amount.toLocaleString("en-IN")}</span></p>
                  <p className="text-xs text-muted-foreground">{r.reason} · Paid via {r.mode} · {r.daysWaiting}d waiting</p>
                </div>
              </div>
            );
          }}
          actions={[
            { label: "Approve & Process", tone: "primary", onClick: (r) => setConfirmRefund(r) },
            { label: "Reject", tone: "danger", onClick: (r) => setRejectRefund(r) },
          ]}
        />

        <ActionQueueCard
          title="Fee waivers awaiting approval" count={waivers.length} badgeTone="amber"
          emptyText="No waivers pending"
          rows={waivers}
          renderRow={(r) => {
            const stu = students.find(s => s.id === r.studentId);
            return (
              <div>
                <p className="text-sm font-medium">{stu?.firstName} {stu?.lastName} <span className="ml-1 text-sm font-semibold text-lnx-teal-500">· {r.pct}% waiver</span></p>
                <p className="text-xs text-muted-foreground">Registrar: {r.reason} · {r.daysWaiting}d waiting</p>
              </div>
            );
          }}
          actions={[
            { label: "Approve", tone: "primary", onClick: (r) => setConfirmWaiver(r) },
            { label: "Reject", tone: "danger", onClick: (r) => setRejectWaiver(r) },
          ]}
        />

        <ActionQueueCard
          title="Approved refunds to process" count={processQueue.length}
          emptyText="All refunds processed"
          rows={processQueue}
          renderRow={(r) => {
            const stu = students.find(s => s.id === r.studentId);
            return (
              <div>
                <p className="text-sm font-medium">{stu?.firstName} {stu?.lastName} <span className="ml-1 text-sm font-semibold text-lnx-navy-800">· ₹{r.amount.toLocaleString("en-IN")}</span></p>
                <p className="text-xs text-muted-foreground">Approved {r.approvedOn} · {r.bank}</p>
              </div>
            );
          }}
          actions={[
            { label: "Mark as Transferred", tone: "primary", icon: Banknote, onClick: (r) => setTransferOpen(r) },
          ]}
        />

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Top Defaulters</h3>
              <Badge variant="outline" className="text-xs">{defaulters.length}</Badge>
            </div>
            <Button size="sm" variant="outline" onClick={() => setBulkReminderOpen(true)} className="h-7 text-xs"><Send className="mr-1 h-3 w-3" />Bulk Reminders</Button>
          </div>
          <ul className="divide-y">
            {defaulters.map(d => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar firstName={d.student.firstName} lastName={d.student.lastName} color={d.student.avatarColor} initials={d.student.initials} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{d.student.firstName} {d.student.lastName}</p>
                    <p className="text-xs text-muted-foreground">₹{d.amount.toLocaleString("en-IN")} · {d.days}d overdue · last reminder {d.lastReminder}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setReminderStudent(d)} className="h-7 text-xs"><Send className="mr-1 h-3 w-3" />Remind</Button>
                  <Button size="sm" variant="outline" onClick={() => setBlockStudent(d)} className="h-7 border-lnx-red-500/40 text-xs text-lnx-red-500"><Lock className="mr-1 h-3 w-3" />Block</Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Scholarship Pipeline</h3>
              <Button size="sm" onClick={() => setDisburseOpen(true)} className="h-7 bg-lnx-teal-500 text-xs text-white hover:bg-lnx-teal-500/90">Disburse Batch</Button>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {[["Applied",24],["Verified",18],["Approved",12],["Disbursed",8],["NSP",6]].map(([l,v]) => (
                <div key={l as string} className="rounded-md border p-2">
                  <div className="text-base font-semibold">{v as number}</div>
                  <div className="text-[10px] text-muted-foreground">{l as string}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold">Reconciliation Discrepancies</h3>
            <ul className="space-y-1.5 text-xs">
              {discrepancies.map(d => (
                <li key={d.id} className="flex items-center justify-between rounded-md border p-2">
                  <div>
                    <div className="font-mono text-[11px]">{d.txnId}</div>
                    <div className="text-[10px] text-muted-foreground">{d.date} · RZ ₹{d.razorpay.toLocaleString("en-IN")} · LG ₹{d.ledger.toLocaleString("en-IN")}</div>
                  </div>
                  {d.diff > 0 ? (
                    <Badge variant="outline" className="border-lnx-red-500/40 text-lnx-red-500">₹{d.diff.toLocaleString("en-IN")} diff</Badge>
                  ) : (
                    <Badge variant="outline" className="border-lnx-green-500/40 text-lnx-green-500">Matched</Badge>
                  )}
                </li>
              ))}
            </ul>
            <Button size="sm" variant="outline" onClick={() => setReconcileOpen(true)} className="mt-3 w-full">Reconcile Razorpay</Button>
          </Card>
        </div>

        <Section title="Quick Actions">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            <QuickAction icon={Plus} label="+ Add Fee Structure" tone="primary" href="/finance/fee-structures" />
            <QuickAction icon={Send} label="Bulk Send Reminders" onClick={() => setBulkReminderOpen(true)} />
            <QuickAction icon={Banknote} label="Process Refund Batch" onClick={() => toast.success("Batch processing started")} />
            <QuickAction icon={FileBarChart} label="Export Financial Report" onClick={() => setExportOpen(true)} />
            <QuickAction icon={GitPullRequest} label="Reconcile Razorpay" onClick={() => setReconcileOpen(true)} />
          </div>
        </Section>
      </div>

      <ConfirmDialog open={!!confirmRefund} onOpenChange={(v) => !v && setConfirmRefund(null)}
        title={`Approve refund of ₹${confirmRefund?.amount.toLocaleString("en-IN")}`}
        description={`To ${students.find(s => s.id === confirmRefund?.studentId)?.firstName} ${students.find(s => s.id === confirmRefund?.studentId)?.lastName}. Funds will move to bank transfer queue.`}
        confirmLabel="Approve & Process" withComment
        onConfirm={() => {
          if (!confirmRefund) return;
          approveRefundCascade(confirmRefund.studentId, confirmRefund.amount, user!.id);
          setRefunds(q => q.filter(x => x.id !== confirmRefund.id));
          setProcessQueue(q => [...q, { id: `pq_${confirmRefund.id}`, studentId: confirmRefund.studentId, amount: confirmRefund.amount, approvedOn: format(new Date(), "dd MMM yyyy"), bank: "Auto-fetched" }]);
          toast.success("Refund approved · moved to processing queue");
        }} />
      <ReasonDialog open={!!rejectRefund} onOpenChange={(v) => !v && setRejectRefund(null)}
        title="Reject refund" description="Reason will be sent to student & registrar"
        confirmLabel="Reject"
        onSubmit={() => { if (!rejectRefund) return; setRefunds(q => q.filter(x => x.id !== rejectRefund.id)); toast(`Refund rejected · ₹${rejectRefund.amount.toLocaleString("en-IN")}`); }} />
      <ConfirmDialog open={!!confirmWaiver} onOpenChange={(v) => !v && setConfirmWaiver(null)}
        title={`Approve ${confirmWaiver?.pct}% waiver`} description={confirmWaiver?.reason}
        confirmLabel="Approve Waiver" withComment
        onConfirm={() => {
          if (!confirmWaiver) return;
          approveWaiverCascade(confirmWaiver.studentId, confirmWaiver.pct, user!.id);
          setWaivers(q => q.filter(x => x.id !== confirmWaiver.id));
          toast.success(`${confirmWaiver.pct}% waiver applied`);
        }} />
      <ReasonDialog open={!!rejectWaiver} onOpenChange={(v) => !v && setRejectWaiver(null)}
        title="Reject waiver" confirmLabel="Reject"
        onSubmit={() => { if (!rejectWaiver) return; setWaivers(q => q.filter(x => x.id !== rejectWaiver.id)); toast(`Waiver declined`); }} />
      <BulkTransferDialog
        open={!!transferOpen} onOpenChange={(v) => !v && setTransferOpen(null)}
        title="Confirm bank transfer"
        items={transferOpen ? [{ id: transferOpen.id, name: `${students.find(s => s.id === transferOpen.studentId)?.firstName ?? ""} ${students.find(s => s.id === transferOpen.studentId)?.lastName ?? ""}`, amount: transferOpen.amount }] : []}
        onConfirm={(utr) => {
          if (!transferOpen) return;
          processRefundCascade(transferOpen.studentId, transferOpen.amount, utr, user!.id);
          setProcessQueue(q => q.filter(x => x.id !== transferOpen.id));
          toast.success("Refund transferred", { description: `UTR ${utr}` });
        }} />
      <MultiChannelPreviewDialog
        open={!!reminderStudent} onOpenChange={(v) => !v && setReminderStudent(null)}
        title="Send fee reminder"
        subject="Fee dues pending"
        body={`Dear ${reminderStudent?.student.firstName},\n\nYour fee dues of ₹${reminderStudent?.amount.toLocaleString("en-IN")} are ${reminderStudent?.days} days overdue. Please clear within 5 working days to avoid suspension.\n\nPay online: portal.bharatedu.in\n\n— Accounts Office`}
        recipients={reminderStudent ? [{ id: reminderStudent.student.id, name: `${reminderStudent.student.firstName} ${reminderStudent.student.lastName}` }] : []}
        defaultChannels={["whatsapp","sms","email"]}
        onSend={(ch) => { if (!reminderStudent) return; sendFeeReminderCascade(reminderStudent.student.id, ch, user!.id); toast.success("Reminder sent"); }}
      />
      <ConfirmDialog open={!!blockStudent} onOpenChange={(v) => !v && setBlockStudent(null)}
        title={`Block exam access for ${blockStudent?.student.firstName}?`}
        description="Student's hall ticket cannot be generated until dues are cleared. Student and parent will be notified."
        confirmLabel="Block Access" tone="danger" withComment
        onConfirm={() => { if (!blockStudent) return; blockExamAccessCascade(blockStudent.student.id, user!.id); toast(`Exam access blocked for ${blockStudent.student.firstName}`); }} />
      <ConfirmDialog open={disburseOpen} onOpenChange={setDisburseOpen}
        title="Disburse approved scholarships"
        description="12 students × ₹15,000 each — total ₹1,80,000 will be credited to student ledgers."
        confirmLabel="Disburse Batch" withComment
        onConfirm={() => { disburseScholarshipCascade(12, 15000, user!.id); toast.success("Scholarships disbursed", { description: "12 students notified" }); }} />
      <MultiChannelPreviewDialog
        open={bulkReminderOpen} onOpenChange={setBulkReminderOpen}
        title="Bulk fee reminders"
        subject="Fee dues pending"
        body={`Dear student,\n\nYour fee dues are pending. Please clear within 5 working days.\n\n— Accounts Office`}
        recipients={defaulters.map(d => ({ id: d.student.id, name: `${d.student.firstName} ${d.student.lastName}` }))}
        defaultChannels={["whatsapp","sms"]}
        onSend={(ch) => { defaulters.forEach(d => sendFeeReminderCascade(d.student.id, ch, user!.id)); toast.success(`${defaulters.length} reminders sent`); }}
      />
      <ProgressDialog open={exportOpen} onOpenChange={setExportOpen}
        title="Exporting Financial Report" description="Generating PDF · Excel · Tally formats…"
        durationMs={2400} successText="Report ready"
        onComplete={() => toast.success("Financial report exported", { description: "finance-jun-2026.zip" })} />
      <ProgressDialog open={reconcileOpen} onOpenChange={setReconcileOpen}
        title="Reconciling Razorpay" description="Matching transactions with ledger…"
        durationMs={2200} successText="2 matched · 1 needs review"
        onComplete={() => toast.success("Reconciliation done", { description: "1 discrepancy flagged for manual review" })} />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// EXAM CELL HEAD — Operations center
// ════════════════════════════════════════════════════════════════════════
function ExamDashboard() {
  const { user } = useAccess();
  const users = useUsersStore(s => s.users);
  const students = users.filter(u => u.role === "student");
  const sections = useAcademicStore(s => s.sections);

  const [overrideQueue, setOverrideQueue] = useState(students.slice(0, 5).map((s, i) => ({
    id: `ov_${s.id}`, student: s,
    exam: ["Mid Sem 1","End Sem","Mid Sem 2","End Sem","Mid Sem 1"][i],
    reason: ["Attendance 64%","Fee dues ₹35K","Both","Attendance 71%","Fee dues ₹28K"][i],
    hodRequested: i % 2 === 0,
  })));
  const [marksLockReqs, setMarksLockReqs] = useState([
    { id: "ml1", subject: "Database Management Systems", faculty: "Dr. Anjali Sharma", section: "CSE-A1", exam: "Mid Sem 1", count: 20 },
    { id: "ml2", subject: "Computer Networks", faculty: "Prof. Sneha Kapoor", section: "CSE-A2", exam: "Mid Sem 1", count: 20 },
    { id: "ml3", subject: "Thermodynamics", faculty: "Dr. Rajesh Yadav", section: "ME-C1", exam: "Mid Sem 1", count: 25 },
  ]);
  const [publishQueue, setPublishQueue] = useState([
    { id: "pub1", section: "CSE-A1", exam: "Mid Sem 1", subjects: 5, ready: true },
    { id: "pub2", section: "ECE-B1", exam: "Mid Sem 1", subjects: 4, ready: true },
  ]);
  const [reevalQueue, setReevalQueue] = useState(students.slice(0, 4).map((s, i) => ({
    id: `re_${s.id}`, student: s,
    subject: ["DBMS","OS","Math III","CN"][i],
    currentMarks: [62,58,55,68][i],
    fee: 500, daysWaiting: 1 + i,
  })));

  const [confirmOverride, setConfirmOverride] = useState<typeof overrideQueue[0] | null>(null);
  const [denyOverride, setDenyOverride] = useState<typeof overrideQueue[0] | null>(null);
  const [confirmLock, setConfirmLock] = useState<typeof marksLockReqs[0] | null>(null);
  const [confirmPublish, setConfirmPublish] = useState<typeof publishQueue[0] | null>(null);
  const [nadOpen, setNadOpen] = useState<{ section: string; exam: string } | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [hallTicketOpen, setHallTicketOpen] = useState(false);

  return (
    <>
      <DashboardHero user={user!} kpis={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Link to="/academic/examinations"><KpiCard label="Upcoming Exams" value="4" icon={Calendar} tone="teal" /></Link>
          <KpiCard label="Eligibility-blocked" value={overrideQueue.length} icon={Lock} tone="amber" />
          <KpiCard label="Marks Entry" value="78%" icon={ClipboardList} />
          <KpiCard label="Results to Publish" value={publishQueue.length} icon={Award} tone="amber" />
          <KpiCard label="Re-eval Queue" value={reevalQueue.length} icon={RotateCcw} />
        </div>
      } />

      <div className="space-y-4">
        <ActionQueueCard
          title="Students blocked from upcoming exams" count={overrideQueue.length} badgeTone="amber"
          emptyText="No eligibility overrides pending"
          rows={overrideQueue}
          renderRow={(r) => (
            <div className="flex items-center gap-3">
              <Avatar firstName={r.student.firstName} lastName={r.student.lastName} color={r.student.avatarColor} initials={r.student.initials} size="sm" />
              <div>
                <p className="text-sm font-medium">{r.student.firstName} {r.student.lastName} <span className="ml-1 text-xs font-normal text-muted-foreground">· {r.exam}</span></p>
                <p className="text-xs text-muted-foreground">{r.reason} {r.hodRequested && <Badge variant="outline" className="ml-1 h-4 border-lnx-teal-500/40 text-[10px] text-lnx-teal-500">HOD requested</Badge>}</p>
              </div>
            </div>
          )}
          actions={[
            { label: "Approve Override", tone: "primary", onClick: (r) => setConfirmOverride(r) },
            { label: "Deny", tone: "danger", onClick: (r) => setDenyOverride(r) },
          ]}
        />

        <ActionQueueCard
          title="Faculty marks lock requests" count={marksLockReqs.length}
          emptyText="No marks lock requests"
          rows={marksLockReqs}
          renderRow={(r) => (
            <div>
              <p className="text-sm font-medium">{r.subject} · <span className="text-xs font-normal text-muted-foreground">{r.exam} · {r.section}</span></p>
              <p className="text-xs text-muted-foreground">By {r.faculty} · {r.count} students</p>
            </div>
          )}
          actions={[
            { label: "Approve & Lock", tone: "primary", icon: Lock, onClick: (r) => setConfirmLock(r) },
            { label: "Review", onClick: (r) => { toast.info(`Opening marks sheet for ${r.subject}`); } },
          ]}
        />

        <ActionQueueCard
          title="Results ready to publish" count={publishQueue.length}
          emptyText="Nothing to publish"
          rows={publishQueue}
          renderRow={(r) => (
            <div>
              <p className="text-sm font-medium">{r.exam} · {r.section}</p>
              <p className="text-xs text-muted-foreground">{r.subjects} subjects · all locked · ready to publish</p>
            </div>
          )}
          actions={[
            { label: "Publish Results", tone: "primary", icon: Award, onClick: (r) => setConfirmPublish(r) },
            { label: "Push to NAD", icon: ShieldCheck, onClick: (r) => setNadOpen({ section: r.section, exam: r.exam }) },
          ]}
        />

        <ActionQueueCard
          title="Re-evaluation requests" count={reevalQueue.length}
          emptyText="No re-evaluation requests"
          rows={reevalQueue}
          renderRow={(r) => (
            <div className="flex items-center gap-3">
              <Avatar firstName={r.student.firstName} lastName={r.student.lastName} color={r.student.avatarColor} initials={r.student.initials} size="sm" />
              <div>
                <p className="text-sm font-medium">{r.student.firstName} {r.student.lastName} · {r.subject}</p>
                <p className="text-xs text-muted-foreground">Current: {r.currentMarks}/100 · Fee ₹{r.fee} paid · {r.daysWaiting}d</p>
              </div>
            </div>
          )}
          actions={[
            { label: "Assign Evaluator", tone: "primary", onClick: (r) => { setReevalQueue(q => q.filter(x => x.id !== r.id)); toast.success(`Evaluator assigned for ${r.student.firstName} · ${r.subject}`); } },
            { label: "Reject", tone: "danger", onClick: (r) => { setReevalQueue(q => q.filter(x => x.id !== r.id)); toast(`Re-evaluation rejected`); } },
          ]}
        />

        <Section title="Quick Actions">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            <QuickAction icon={Calendar} label="Schedule New Exam" tone="primary" onClick={() => setScheduleOpen(true)} />
            <QuickAction icon={FileText} label="Generate Hall Tickets" onClick={() => setHallTicketOpen(true)} />
            <QuickAction icon={ClipboardList} label="View Marks Entry" href="/academic/examinations" />
            <QuickAction icon={Award} label="Publish Results" href="/academic/examinations" />
            <QuickAction icon={ShieldCheck} label="NAD Bulk Push" onClick={() => setNadOpen({ section: "ALL", exam: "Sem 4 End" })} />
          </div>
        </Section>
      </div>

      <ConfirmDialog open={!!confirmOverride} onOpenChange={(v) => !v && setConfirmOverride(null)}
        title={`Approve eligibility override for ${confirmOverride?.student.firstName}?`}
        description={`Hall ticket will be regenerated for ${confirmOverride?.exam}. HOD will be notified.`}
        confirmLabel="Approve Override" withComment
        onConfirm={(c) => {
          if (!confirmOverride) return;
          overrideEligibilityCascade(confirmOverride.student.id, true, c || "HOD recommendation", user!.id);
          setOverrideQueue(q => q.filter(x => x.id !== confirmOverride.id));
          toast.success(`Override approved · hall ticket regenerated`);
        }} />
      <ReasonDialog open={!!denyOverride} onOpenChange={(v) => !v && setDenyOverride(null)}
        title="Deny override" confirmLabel="Deny"
        onSubmit={(r) => { if (!denyOverride) return; overrideEligibilityCascade(denyOverride.student.id, false, r, user!.id); setOverrideQueue(q => q.filter(x => x.id !== denyOverride.id)); toast(`Override denied`); }} />
      <ConfirmDialog open={!!confirmLock} onOpenChange={(v) => !v && setConfirmLock(null)}
        title={`Lock ${confirmLock?.subject} marks?`}
        description={`Once locked, marks cannot be edited without an override. ${confirmLock?.exam} · ${confirmLock?.section}.`}
        confirmLabel="Lock Marks"
        onConfirm={() => { if (!confirmLock) return; lockMarksCascade(confirmLock.section, confirmLock.exam, confirmLock.subject, user!.id); setMarksLockReqs(q => q.filter(x => x.id !== confirmLock.id)); toast.success(`Marks locked · ready for publish`); }} />
      <ConfirmDialog open={!!confirmPublish} onOpenChange={(v) => !v && setConfirmPublish(null)}
        title={`Publish ${confirmPublish?.exam} results?`}
        description={`${confirmPublish?.section} · all students & parents will be notified immediately.`}
        confirmLabel="Publish Results"
        onConfirm={() => { if (!confirmPublish) return; publishResultsCascade(confirmPublish.section, confirmPublish.exam, user!.id); setPublishQueue(q => q.filter(x => x.id !== confirmPublish.id)); toast.success("Results published"); }} />
      <ConfirmDialog open={!!nadOpen} onOpenChange={(v) => !v && setNadOpen(null)}
        title="Push grade cards to NAD (DigiLocker)?"
        description={`${nadOpen?.exam} · ${nadOpen?.section}. Grade cards will be available in students' DigiLocker.`}
        confirmLabel="Push to NAD"
        onConfirm={() => { if (!nadOpen) return; nadPushCascade(nadOpen.section, nadOpen.exam, user!.id); toast.success("NAD push complete", { description: `${nadOpen.exam} · ${nadOpen.section}` }); }} />
      <ProgressDialog open={scheduleOpen} onOpenChange={setScheduleOpen}
        title="Scheduling Exam" durationMs={1800} successText="Exam scheduled"
        onComplete={() => toast.success("Exam scheduled", { description: "Faculty invigilation slots auto-allocated" })} />
      <ProgressDialog open={hallTicketOpen} onOpenChange={setHallTicketOpen}
        title="Generating Hall Tickets" description="Checking eligibility · creating PDFs…"
        durationMs={2400} successText="Hall tickets generated"
        onComplete={() => toast.success("142 hall tickets generated", { description: "18 students blocked — see override queue" })} />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// HOD — Department control
// ════════════════════════════════════════════════════════════════════════
function HodDashboard() {
  const { user } = useAccess();
  const users = useUsersStore(s => s.users);
  const dept = user!.department ?? "CSE";
  const deptStudents = users.filter(u => u.role === "student" && u.department === dept);
  const deptFaculty = users.filter(u => u.role === "faculty" && u.department === dept);
  const navigate = useNavigate();

  const lowAtt = deptStudents.filter(s => (s.attendancePct ?? 100) < 75).slice(0, 5);
  const [leaveReqs, setLeaveReqs] = useState(deptFaculty.slice(0, 3).map((f, i) => ({
    id: `lv_${f.id}`, faculty: f, days: 1 + i, reason: ["Medical","Personal","Conference"][i],
  })));
  const [overrideReqs, setOverrideReqs] = useState(deptStudents.slice(0, 3).map((s, i) => ({
    id: `or_${s.id}`, student: s, type: ["Attendance","Eligibility","Project Extension"][i],
  })));

  const [alertStudent, setAlertStudent] = useState<User | null>(null);
  const [confirmLeave, setConfirmLeave] = useState<typeof leaveReqs[0] | null>(null);
  const [confirmOR, setConfirmOR] = useState<typeof overrideReqs[0] | null>(null);

  return (
    <>
      <DashboardHero user={user!} kpis={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label={`${dept} Students`} value={deptStudents.length} icon={GraduationCap} tone="teal" />
          <KpiCard label="Faculty in Dept" value={deptFaculty.length} icon={Users} />
          <KpiCard label="Low Attendance (<75%)" value={lowAtt.length} icon={AlertTriangle} tone="amber" />
          <KpiCard label="Pending Approvals" value={leaveReqs.length + overrideReqs.length} icon={ClipboardList} />
        </div>
      } />

      <div className="space-y-4">
        <ActionQueueCard
          title={`At-risk students in ${dept}`} count={lowAtt.length} badgeTone="amber"
          emptyText="All students above threshold"
          rows={lowAtt.map(s => ({ ...s, id: s.id }))}
          renderRow={(s) => (
            <div className="flex items-center gap-3">
              <Avatar firstName={s.firstName} lastName={s.lastName} color={s.avatarColor} initials={s.initials} size="sm" />
              <div>
                <p className="text-sm font-medium">{s.firstName} {s.lastName} <span className="ml-1 text-xs font-normal text-muted-foreground">· {s.sectionId}</span></p>
                <p className="text-xs text-muted-foreground">Attendance: <strong className={(s.attendancePct ?? 100) < 65 ? "text-lnx-red-500" : "text-lnx-amber-500"}>{s.attendancePct}%</strong></p>
              </div>
            </div>
          )}
          actions={[
            { label: "Send Alert", tone: "primary", icon: Send, onClick: (s) => setAlertStudent(s as any) },
            { label: "View Profile", onClick: (s) => navigate({ to: `/people/students/${s.id}` }) },
          ]}
        />

        <ActionQueueCard
          title="Faculty leave requests" count={leaveReqs.length}
          emptyText="No leave requests pending"
          rows={leaveReqs}
          renderRow={(r) => (
            <div className="flex items-center gap-3">
              <Avatar firstName={r.faculty.firstName} lastName={r.faculty.lastName} color={r.faculty.avatarColor} initials={r.faculty.initials} size="sm" />
              <div>
                <p className="text-sm font-medium">{r.faculty.firstName} {r.faculty.lastName}</p>
                <p className="text-xs text-muted-foreground">{r.days} day{r.days !== 1 ? "s" : ""} · {r.reason}</p>
              </div>
            </div>
          )}
          actions={[
            { label: "Approve", tone: "primary", onClick: (r) => setConfirmLeave(r) },
            { label: "Reject", tone: "danger", onClick: (r) => { setLeaveReqs(q => q.filter(x => x.id !== r.id)); toast(`Leave declined`); } },
          ]}
        />

        <ActionQueueCard
          title="Student override requests" count={overrideReqs.length}
          emptyText="No override requests"
          rows={overrideReqs}
          renderRow={(r) => (
            <div>
              <p className="text-sm font-medium">{r.student.firstName} {r.student.lastName} <span className="ml-1 text-xs font-normal text-muted-foreground">· {r.type}</span></p>
            </div>
          )}
          actions={[
            { label: "Forward to Exam Cell", tone: "primary", onClick: (r) => { setOverrideReqs(q => q.filter(x => x.id !== r.id)); toast.success(`Forwarded to Exam Cell with HOD recommendation`); } },
            { label: "Reject", tone: "danger", onClick: (r) => { setOverrideReqs(q => q.filter(x => x.id !== r.id)); toast(`Request rejected`); } },
          ]}
        />

        <Section title="Quick Actions">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <QuickAction icon={Megaphone} label="Dept Announcement" tone="primary" href="/communication/announcements" />
            <QuickAction icon={Calendar} label="View Timetable" href="/academic/timetable" />
            <QuickAction icon={Users} label="Manage Faculty" href="/people/faculty" />
            <QuickAction icon={FileBarChart} label="Dept Report" onClick={() => toast.success("Department report generated")} />
          </div>
        </Section>
      </div>

      <MultiChannelPreviewDialog
        open={!!alertStudent} onOpenChange={(v) => !v && setAlertStudent(null)}
        title={`Alert ${alertStudent?.firstName} & parent`}
        subject="Attendance below threshold"
        body={`Dear ${alertStudent?.firstName},\n\nYour attendance is below the required threshold of 75%. You may be debarred from exams. Please meet your HOD this week.\n\nRegards,\nHOD ${dept}`}
        recipients={alertStudent ? [
          { id: alertStudent.id, name: `${alertStudent.firstName} ${alertStudent.lastName}` },
          ...users.filter(u => u.role === "parent" && u.childId === alertStudent.id).map(p => ({ id: p.id, name: `Parent of ${alertStudent.firstName}` })),
        ] : []}
        defaultChannels={["whatsapp","email"]}
        onSend={() => toast.success("Alert sent to student & parent")} />
      <ConfirmDialog open={!!confirmLeave} onOpenChange={(v) => !v && setConfirmLeave(null)}
        title={`Approve ${confirmLeave?.days} day leave?`} description={`${confirmLeave?.faculty.firstName} ${confirmLeave?.faculty.lastName} · ${confirmLeave?.reason}`}
        confirmLabel="Approve" withComment
        onConfirm={() => { if (!confirmLeave) return; setLeaveReqs(q => q.filter(x => x.id !== confirmLeave.id)); toast.success(`Leave approved · substitute auto-suggested`); }} />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// FACULTY (and Lab Faculty) — Daily organizer
// ════════════════════════════════════════════════════════════════════════
function FacultyDashboard({ isLab = false }: { isLab?: boolean }) {
  const { user } = useAccess();
  const users = useUsersStore(s => s.users);
  const timetable = useAcademicStore(s => s.timetable);
  const subjects = useAcademicStore(s => s.subjects);
  const sections = useAcademicStore(s => s.sections);
  const navigate = useNavigate();

  const todaySlots = timetable.filter(t => t.facultyId === user!.id).slice(0, 4);
  const [pendingMarks, setPendingMarks] = useState([
    { id: "pm1", section: "CSE-A1", subject: "DBMS", exam: "Mid Sem 1", count: 20, deadline: "5 Jun" },
    { id: "pm2", section: "CSE-A2", subject: "DBMS", exam: "Mid Sem 1", count: 20, deadline: "5 Jun" },
  ]);
  const [leaveReqs, setLeaveReqs] = useState([
    { id: "lr1", student: users.find(u => u.role === "student")!, days: 2, reason: "Family function" },
    { id: "lr2", student: users.filter(u => u.role === "student")[1]!, days: 1, reason: "Medical" },
  ]);

  const [confirmAtt, setConfirmAtt] = useState<typeof todaySlots[0] | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [leaveAppOpen, setLeaveAppOpen] = useState(false);

  return (
    <>
      <DashboardHero user={user!} kpis={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Today's Classes" value={todaySlots.length} icon={Calendar} tone="teal" />
          <KpiCard label="Pending Marks Entry" value={pendingMarks.length} icon={ClipboardList} tone="amber" />
          <KpiCard label="Leave Requests" value={leaveReqs.length} icon={Bell} />
          <KpiCard label="Avg Section Att%" value="86%" icon={Activity} />
        </div>
      } />

      <Section title="Today's Schedule">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {todaySlots.length === 0 ? (
            <Card className="col-span-2 p-6"><EmptyState title="No classes today" body="Enjoy your day off" /></Card>
          ) : todaySlots.map(slot => {
            const sub = subjects.find(s => s.id === slot.subjectId);
            const sec = sections.find(s => s.id === slot.sectionId);
            return (
              <Card key={slot.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{sub?.code} · {sub?.name}</p>
                    <p className="text-xs text-muted-foreground">{sec?.name} · Slot {slot.slot + 1} · Room {slot.roomId}</p>
                  </div>
                  <Button size="sm" onClick={() => setConfirmAtt(slot)} className="h-7 bg-lnx-teal-500 text-xs text-white hover:bg-lnx-teal-500/90">
                    <CheckCircle2 className="mr-1 h-3 w-3" />Mark Attendance
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </Section>

      <div className="mt-4 space-y-4">
        <ActionQueueCard
          title="Pending marks entry" count={pendingMarks.length} badgeTone="amber"
          emptyText="All marks entered"
          rows={pendingMarks}
          renderRow={(r) => (
            <div>
              <p className="text-sm font-medium">{r.subject} · {r.section} · {r.exam}</p>
              <p className="text-xs text-muted-foreground">{r.count} students · deadline {r.deadline}</p>
            </div>
          )}
          actions={[
            { label: "Enter Marks", tone: "primary", icon: ClipboardList, onClick: (r) => { navigate({ to: "/academic/examinations" }); toast.info(`Opening ${r.subject} marks sheet`); } },
            { label: "Request Lock", onClick: (r) => { setPendingMarks(q => q.filter(x => x.id !== r.id)); toast.success(`Lock request sent to Exam Cell · ${r.subject}`); } },
          ]}
        />

        <ActionQueueCard
          title="Student leave requests" count={leaveReqs.length}
          emptyText="No leave requests"
          rows={leaveReqs}
          renderRow={(r) => (
            <div className="flex items-center gap-3">
              <Avatar firstName={r.student.firstName} lastName={r.student.lastName} color={r.student.avatarColor} initials={r.student.initials} size="sm" />
              <div>
                <p className="text-sm font-medium">{r.student.firstName} {r.student.lastName}</p>
                <p className="text-xs text-muted-foreground">{r.days} day{r.days !== 1 ? "s" : ""} · {r.reason}</p>
              </div>
            </div>
          )}
          actions={[
            { label: "Approve", tone: "primary", onClick: (r) => { setLeaveReqs(q => q.filter(x => x.id !== r.id)); toast.success(`Leave approved · ${r.student.firstName}`); } },
            { label: "Reject", tone: "danger", onClick: (r) => { setLeaveReqs(q => q.filter(x => x.id !== r.id)); toast(`Leave rejected`); } },
          ]}
        />

        <Section title="Quick Actions">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            <QuickAction icon={CheckCircle2} label="Mark Today's Attendance" tone="primary" href="/academic/attendance" />
            <QuickAction icon={ClipboardList} label="Enter Marks" href="/academic/examinations" />
            <QuickAction icon={Upload} label="Upload Material" onClick={() => setUploadOpen(true)} />
            <QuickAction icon={Calendar} label="Apply Leave" onClick={() => setLeaveAppOpen(true)} />
            {isLab && <QuickAction icon={Settings} label="Configure Lab" onClick={() => toast.success("Lab settings drawer (demo)")} />}
          </div>
        </Section>
      </div>

      <ConfirmDialog open={!!confirmAtt} onOpenChange={(v) => !v && setConfirmAtt(null)}
        title="Open attendance sheet?"
        description="You'll be taken to the attendance marking interface for this class."
        confirmLabel="Open Sheet"
        onConfirm={() => { navigate({ to: "/academic/attendance" }); toast.info("Opening attendance sheet"); }} />
      <UploadMaterialDialog open={uploadOpen} onOpenChange={setUploadOpen} actorId={user!.id} />
      <ProgressDialog open={leaveAppOpen} onOpenChange={setLeaveAppOpen}
        title="Submitting Leave Application" durationMs={1500} successText="Leave application sent to HOD"
        onComplete={() => toast.success("Leave submitted", { description: "HOD will be notified" })} />
    </>
  );
}

function UploadMaterialDialog({ open, onOpenChange, actorId }: { open: boolean; onOpenChange: (v: boolean) => void; actorId: string }) {
  const [name, setName] = useState("Week 5 — Normalization.pdf");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Study Material</DialogTitle>
          <DialogDescription>Students in your section will be notified.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">File name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
          <div className="rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
            <Upload className="mx-auto mb-2 h-8 w-8" />
            Drop file or click to upload (demo)
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-lnx-teal-500 text-white hover:bg-lnx-teal-500/90" onClick={() => {
            uploadMaterialCascade("CSE-A1", "CS301", name, actorId);
            toast.success(`Uploaded · 20 students notified`);
            onOpenChange(false);
          }}>Upload</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ════════════════════════════════════════════════════════════════════════
// STUDENT — Mobile-first life hub
// ════════════════════════════════════════════════════════════════════════
function StudentDashboard() {
  const { user } = useAccess();
  const timetable = useAcademicStore(s => s.timetable);
  const subjects = useAcademicStore(s => s.subjects);
  const ledger = useFinanceStore(s => s.ledger);
  const navigate = useNavigate();

  const myLedger = ledger.filter(l => l.studentId === user!.id);
  const balance = myLedger[0]?.balance ?? 60000;
  const todaySlots = timetable.filter(t => t.sectionId === user!.sectionId).slice(0, 4);
  const nextClass = todaySlots[0];
  const nextSubject = subjects.find(s => s.id === nextClass?.subjectId);

  const [drives] = useState(usePlacementStore.getState().drives.filter(d => d.status === "active" || d.status === "upcoming").slice(0, 3));
  const [payOpen, setPayOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState<typeof drives[0] | null>(null);

  return (
    <>
      <DashboardHero user={user!} kpis={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Attendance" value={`${user!.attendancePct ?? 88}%`} icon={Activity} tone={(user!.attendancePct ?? 88) >= 75 ? "teal" : "amber"} />
          <KpiCard label="CGPA" value={user!.cgpa ?? "8.2"} icon={Award} />
          <KpiCard label="Fee Balance" value={inr(balance)} icon={Wallet} tone={balance > 0 ? "amber" : "teal"} />
          <KpiCard label="Backlogs" value={user!.backlogs ?? 0} icon={ClipboardList} />
        </div>
      } />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Next Class</h3>
          {nextClass && nextSubject ? (
            <div>
              <p className="text-base font-semibold text-lnx-navy-800">{nextSubject.code} · {nextSubject.name}</p>
              <p className="text-xs text-muted-foreground">Room {nextClass.roomId} · Slot {nextClass.slot + 1}</p>
              <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => navigate({ to: "/academic/timetable" })}>View Full Timetable</Button>
            </div>
          ) : <EmptyState title="No more classes today" />}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Fee Status</h3>
            <Badge variant="outline" className={balance > 0 ? "border-lnx-amber-500/40 text-lnx-amber-500" : "border-lnx-green-500/40 text-lnx-green-500"}>
              {balance > 0 ? `${inr(balance)} due` : "All clear"}
            </Badge>
          </div>
          <div className="space-y-2">
            <Progress value={balance > 0 ? 60 : 100} />
            <p className="text-xs text-muted-foreground">Sem 5 Installment 2 · Due 15 Jun 2026</p>
          </div>
          {balance > 0 && (
            <Button size="sm" className="mt-3 w-full bg-lnx-teal-500 text-white hover:bg-lnx-teal-500/90" onClick={() => setPayOpen(true)}>
              <CreditCard className="mr-1 h-3.5 w-3.5" />Pay {inr(balance)}
            </Button>
          )}
        </Card>
      </div>

      <ActionQueueCard
        title="Drives open for you" count={drives.length} badgeTone="muted"
        emptyText="No drives open right now"
        rows={drives}
        renderRow={(d) => {
          const co = usePlacementStore.getState().companies.find(c => c.id === d.companyId);
          return (
            <div>
              <p className="text-sm font-medium">{co?.name} · <span className="text-xs font-normal text-muted-foreground">{d.role}</span></p>
              <p className="text-xs text-muted-foreground">{d.package} · CGPA cutoff {d.cgpaCutoff} · Closes {format(new Date(d.endDate), "dd MMM")}</p>
            </div>
          );
        }}
        actions={[
          { label: "Apply", tone: "primary", onClick: (d) => setApplyOpen(d) },
          { label: "View Details", onClick: (d) => navigate({ to: `/placement/drives/${d.id}` }) },
        ]}
      />

      <Section title="Quick Actions" className="mt-4">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <QuickAction icon={CreditCard} label="Pay Fees" tone="primary" onClick={() => setPayOpen(true)} />
          <QuickAction icon={Bot} label="Take AI Assessment" href="/placement/ai-assessments" />
          <QuickAction icon={Award} label="View Results" href="/my/results" />
          <QuickAction icon={FileText} label="Request Certificate" onClick={() => toast.success("Certificate request submitted")} />
          <QuickAction icon={BookOpen} label="Study Material" href="/academic/study-material" />
        </div>
      </Section>

      <RazorpayMock open={payOpen} onOpenChange={setPayOpen}
        amount={balance} orderId={`ord_${Date.now().toString(36)}`}
        description="Sem 5 Installment 2"
        onSuccess={(mode, txnId) => { payFeeCascade(user!.id, balance, mode, user!.id); toast.success("Payment received", { description: `${mode} · ${txnId}` }); }} />
      <ConfirmDialog open={!!applyOpen} onOpenChange={(v) => !v && setApplyOpen(null)}
        title={`Apply to ${usePlacementStore.getState().companies.find(c => c.id === applyOpen?.companyId)?.name}?`}
        description={`Your profile and resume will be submitted. You'll be notified about MCQ test schedule.`}
        confirmLabel="Confirm Application"
        onConfirm={() => { toast.success("Applied successfully · MCQ test scheduled for tomorrow"); }} />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// PARENT — Single-child monitor
// ════════════════════════════════════════════════════════════════════════
function ParentDashboard() {
  const { user } = useAccess();
  const users = useUsersStore(s => s.users);
  const child = users.find(u => u.id === user!.childId);
  const ledger = useFinanceStore(s => s.ledger);
  const navigate = useNavigate();

  const childLedger = child ? ledger.filter(l => l.studentId === child.id) : [];
  const balance = childLedger[0]?.balance ?? 60000;

  const [payOpen, setPayOpen] = useState(false);
  const [waOptOpen, setWaOptOpen] = useState(true);
  const [messageOpen, setMessageOpen] = useState(false);

  if (!child) return <GenericDashboard />;

  return (
    <>
      <DashboardHero user={user!} kpis={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Attendance" value={`${child.attendancePct ?? 86}%`} icon={Activity} tone={(child.attendancePct ?? 86) >= 75 ? "teal" : "amber"} />
          <KpiCard label="CGPA" value={child.cgpa ?? "8.2"} icon={Award} />
          <KpiCard label="Fee Balance" value={inr(balance)} icon={Wallet} tone={balance > 0 ? "amber" : "teal"} />
          <KpiCard label="Notifications" value="3" icon={Bell} />
        </div>
      } />

      <Card className="p-4 mb-4">
        <div className="flex items-center gap-4">
          <Avatar firstName={child.firstName} lastName={child.lastName} color={child.avatarColor} initials={child.initials} size="lg" />
          <div className="flex-1">
            <p className="text-lg font-semibold text-lnx-navy-800">{child.firstName} {child.lastName}</p>
            <p className="text-xs text-muted-foreground">{child.sectionId} · {child.rollNo ?? child.id}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            <span className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${(child.attendancePct ?? 86) >= 85 ? "bg-lnx-green-500/10 text-lnx-green-500" : "bg-lnx-amber-500/10 text-lnx-amber-500"}`}>
              <span className="inline-block h-2 w-2 rounded-full bg-current" />Attendance OK
            </span>
            <span className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${(child.cgpa ?? 8) >= 7.5 ? "bg-lnx-green-500/10 text-lnx-green-500" : "bg-lnx-amber-500/10 text-lnx-amber-500"}`}>
              <span className="inline-block h-2 w-2 rounded-full bg-current" />Academics OK
            </span>
            <span className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${balance === 0 ? "bg-lnx-green-500/10 text-lnx-green-500" : "bg-lnx-amber-500/10 text-lnx-amber-500"}`}>
              <span className="inline-block h-2 w-2 rounded-full bg-current" />{balance > 0 ? "Fees pending" : "Fees clear"}
            </span>
          </div>
        </div>
      </Card>

      <Section title="Quick Actions">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {balance > 0 && <QuickAction icon={CreditCard} label={`Pay ${inr(balance)} on behalf`} tone="primary" onClick={() => setPayOpen(true)} />}
          <QuickAction icon={Award} label="View Results" href="/my/results" />
          <QuickAction icon={MessageSquare} label="Message Faculty" onClick={() => setMessageOpen(true)} />
          <QuickAction icon={Phone} label="Enable WhatsApp Alerts" onClick={() => setWaOptOpen(true)} />
        </div>
      </Section>

      <RazorpayMock open={payOpen} onOpenChange={setPayOpen}
        amount={balance} orderId={`ord_${Date.now().toString(36)}`}
        description={`Fee for ${child.firstName} ${child.lastName}`}
        onSuccess={(mode, txnId) => { payFeeCascade(child.id, balance, mode, user!.id); toast.success("Payment successful", { description: `${mode} · ${txnId}` }); }} />
      <ConfirmDialog open={waOptOpen} onOpenChange={setWaOptOpen}
        title="Enable WhatsApp alerts?"
        description="Get attendance, fee, and result updates on +91 98XXX XX489. You can disable any time."
        confirmLabel="Enable"
        onConfirm={() => { optInWhatsappCascade(user!.id); toast.success("WhatsApp alerts enabled"); }} />
      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Message Faculty / HOD</DialogTitle>
            <DialogDescription>Sent to the class teacher for {child.firstName}</DialogDescription>
          </DialogHeader>
          <Textarea rows={4} placeholder="Type your message…" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMessageOpen(false)}>Cancel</Button>
            <Button className="bg-lnx-teal-500 text-white hover:bg-lnx-teal-500/90" onClick={() => { toast.success("Message sent to faculty"); setMessageOpen(false); }}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// GENERIC fallback (clerk, timetable_coord, unknown)
// ════════════════════════════════════════════════════════════════════════
function GenericDashboard() {
  const { user } = useAccess();
  return (
    <>
      <DashboardHero user={user!} kpis={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Open Tasks" value="6" icon={ClipboardList} tone="teal" />
          <KpiCard label="Today's Schedule" value="—" icon={Calendar} />
          <KpiCard label="Notifications" value="3" icon={Bell} />
          <KpiCard label="Profile" value="OK" icon={ShieldCheck} />
        </div>
      } />
      <EmptyState title="Workbench coming soon" body={`A role-specific dashboard for ${ROLE_LABEL[user!.role]} will land next. For now, use the sidebar to access your modules.`} />
    </>
  );
}

// ─── Local imports for the embedded dialogs ──────────────────────────────
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
