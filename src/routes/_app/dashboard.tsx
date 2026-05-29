import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { KpiCard } from "@/components/common/KpiCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/lib/access";
import { useAccessStore, useUsersStore, useAcademicStore, usePlacementStore, useFinanceStore, useCommStore, useComplianceStore } from "@/stores";
import { INSTITUTION } from "@/data/seed";
import { ROLE_LABEL } from "@/lib/types";
import {
  Users, GraduationCap, ClipboardList, Wallet, Briefcase, ShieldCheck,
  CheckCircle2, XCircle, Calendar, Award, BookMarked, KeyRound,
  BadgeCheck, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LearnNowX" }] }),
  component: DashboardRouter,
});

function DashboardRouter() {
  const { user } = useAccess();
  if (!user) return null;
  switch (user.role) {
    case "hoi": return <HoiDashboard />;
    case "tpo_head": return <TpoDashboard />;
    case "finance_head": return <FinanceDashboard />;
    case "exam_head": return <ExamDashboard />;
    case "registrar": return <RegistrarDashboard />;
    case "hod": return <HodDashboard />;
    case "faculty":
    case "lab_faculty": return <FacultyDashboard />;
    case "student": return <StudentDashboard />;
    case "parent": return <ParentDashboard />;
    default: return <GenericDashboard />;
  }
}

function HoiDashboard() {
  const requests = useAccessStore(s => s.requests).filter(r => r.status === "pending");
  const resolve = useAccessStore(s => s.resolveRequest);
  const addAudit = useAccessStore(s => s.addAudit);
  const users = useUsersStore(s => s.users);
  const criteria = useComplianceStore(s => s.criteria);
  const drives = usePlacementStore(s => s.drives);

  const stuCount = users.filter(u => u.role === "student").length;
  const facCount = users.filter(u => u.role === "faculty" || u.role === "lab_faculty" || u.role === "hod").length;
  const naacReadiness = Math.round(criteria.reduce((a,c) => a + c.readiness, 0) / criteria.length);

  return (
    <div>
      <PageHeader
        title={`${INSTITUTION.name}`}
        subtitle={`${INSTITUTION.type} · ${INSTITUTION.city} · Founded ${INSTITUTION.founded}`}
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Students" value={stuCount} icon={GraduationCap} delta={{ value: "+12 this month", up: true }} />
        <KpiCard label="Faculty" value={facCount} icon={Users} />
        <KpiCard label="Attendance Today" value="91%" icon={ClipboardList} tone="green" />
        <KpiCard label="Fees This Month" value="₹48.3L" icon={Wallet} delta={{ value: "+8%", up: true }} />
        <KpiCard label="Placement YTD" value="76%" icon={Briefcase} tone="teal" />
        <KpiCard label="NAAC Readiness" value={`${naacReadiness}%`} icon={ShieldCheck} tone={naacReadiness >= 75 ? "green" : "amber"} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-lnx-navy-800">Pending Approvals</h3>
            <Link to="/admin/access-control/requests" className="text-xs font-medium text-lnx-teal-500 hover:underline">View all</Link>
          </div>
          {requests.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">All caught up</p>}
          <div className="divide-y">
            {requests.slice(0, 4).map(r => {
              const target = users.find(u => u.id === r.userId);
              const requester = users.find(u => u.id === r.requestedBy);
              return (
                <div key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-lnx-navy-800">{target?.firstName} {target?.lastName} <span className="text-xs font-normal text-muted-foreground">· {r.change}</span></div>
                    <div className="text-xs text-muted-foreground">Requested by {requester?.firstName} {requester?.lastName} · {r.reason}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => { resolve(r.id, "rejected", "", "u_hoi"); addAudit({ id: `a_${Date.now()}`, at: new Date().toISOString(), actorId: "u_hoi", targetId: r.userId, action: "Rejected request", module: "RBAC", reason: r.reason }); toast.info("Request rejected"); }}><XCircle className="mr-1 h-3 w-3" /> Reject</Button>
                    <Button size="sm" onClick={() => { resolve(r.id, "approved", "", "u_hoi"); addAudit({ id: `a_${Date.now()}`, at: new Date().toISOString(), actorId: "u_hoi", targetId: r.userId, action: "Approved request", module: "RBAC", reason: r.reason }); toast.success("Request approved"); }}><CheckCircle2 className="mr-1 h-3 w-3" /> Approve</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-lnx-navy-800">NAAC Criteria Readiness</h3>
          <div className="space-y-2">
            {criteria.map(c => (
              <div key={c.id} className="flex items-center justify-between text-xs">
                <span className="truncate">{c.number}. {c.name}</span>
                <span className={
                  c.status === "green" ? "rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700" :
                  c.status === "amber" ? "rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700" :
                  "rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700"
                }>{c.readiness}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-lnx-navy-800">Active Drives</h3>
          <div className="space-y-3">
            {drives.filter(d => d.status === "active").map(d => (
              <div key={d.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-lnx-navy-800">{d.role}</div>
                  <div className="text-xs text-muted-foreground">{d.branches.join(", ")} · CGPA ≥ {d.cgpaCutoff}</div>
                </div>
                <Badge variant="outline" className="tabular">{d.appliedIds.length} applied</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-lnx-navy-800">Quick Links</h3>
          <div className="grid grid-cols-2 gap-2">
            <QuickLink to="/admin/access-control" icon={KeyRound} label="Access Control" />
            <QuickLink to="/people/students" icon={GraduationCap} label="Students" />
            <QuickLink to="/placement/drives" icon={Briefcase} label="Drives" />
            <QuickLink to="/compliance/naac" icon={ShieldCheck} label="NAAC" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-lg border bg-card p-3 text-sm hover:border-lnx-teal-500 hover:bg-accent">
      <div className="rounded-md bg-accent p-2 text-lnx-navy-800"><Icon className="h-4 w-4" /></div>
      <span className="font-medium text-lnx-navy-800">{label}</span>
    </Link>
  );
}

function FacultyDashboard() {
  const { user } = useAccess();
  const notifs = useCommStore(s => s.notifications).filter(n => n.userId === user?.id);
  return (
    <div>
      <PageHeader title={`Welcome, Prof. ${user?.firstName}`} subtitle={`${user?.designation} · ${user?.department}`} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Today's Classes" value="3" icon={Calendar} />
        <KpiCard label="Pending Attendance" value="1" icon={ClipboardList} tone="amber" />
        <KpiCard label="Avg Class Attendance" value="87%" icon={CheckCircle2} tone="green" />
        <KpiCard label="Leave Balance" value="12" icon={Award} />
      </div>
      <Card className="mt-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-lnx-navy-800">Pending Attendance — Mark Now</h3>
          <Link to="/academic/attendance/mark" className="text-xs font-medium text-lnx-teal-500 hover:underline">Open attendance</Link>
        </div>
        <div className="rounded-lg border bg-accent/40 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-lnx-navy-800">DBMS · CSE-A1 · Slot 1</div>
              <div className="text-xs text-muted-foreground">LH-101 · {format(new Date(), "EEE, dd MMM")} · 20 students</div>
            </div>
            <Button asChild><Link to="/academic/attendance/mark">Mark Now</Link></Button>
          </div>
        </div>
      </Card>
      <Card className="mt-4 p-5">
        <h3 className="mb-3 text-sm font-semibold text-lnx-navy-800">Notifications</h3>
        {notifs.length === 0 && <p className="text-xs text-muted-foreground">All caught up</p>}
        {notifs.map(n => (
          <div key={n.id} className="border-b py-2 text-sm last:border-0">
            <div className="font-medium text-lnx-navy-800">{n.title}</div>
            <div className="text-xs text-muted-foreground">{n.meta}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function StudentDashboard() {
  const { user } = useAccess();
  const att = user?.attendancePct ?? 0;
  const drives = usePlacementStore(s => s.drives).filter(d => d.branches.includes(user?.department ?? ""));
  return (
    <div>
      <PageHeader title={`Welcome, ${user?.firstName}`} subtitle={`Roll No ${user?.rollNo} · ${user?.department} · Batch ${user?.batch}`} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Attendance" value={`${att}%`} icon={ClipboardList} tone={att >= 75 ? "green" : att >= 65 ? "amber" : "red"} />
        <KpiCard label="CGPA" value={user?.cgpa ?? "—"} icon={Award} />
        <KpiCard label="Active Backlogs" value={user?.backlogs ?? 0} icon={BookMarked} tone={user?.backlogs ? "red" : "green"} />
        <KpiCard label="Fee Due" value="₹60,000" icon={Wallet} tone="amber" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-lnx-navy-800">Today's Next Class</h3>
          <div className="rounded-lg border bg-accent/40 p-4">
            <div className="text-sm font-medium text-lnx-navy-800">DBMS · Prof. Anjali Sharma</div>
            <div className="text-xs text-muted-foreground">LH-101 · Slot 1 · In 25 minutes</div>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-lnx-navy-800">Open Drives</h3>
          <div className="space-y-2">
            {drives.slice(0, 3).map(d => (
              <div key={d.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-lnx-navy-800">{d.role}</div>
                  <div className="text-xs text-muted-foreground">{d.package} · CGPA ≥ {d.cgpaCutoff}</div>
                </div>
                <Badge variant={d.status === "active" ? "default" : "outline"}>{d.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ParentDashboard() {
  const { user } = useAccess();
  const child = useUsersStore(s => s.users.find(u => u.id === user?.childId));
  return (
    <div>
      <PageHeader title={`Parent · ${child?.firstName} ${child?.lastName}`} subtitle={`Roll No ${child?.rollNo} · ${child?.department}`} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Attendance" value={`${child?.attendancePct ?? 0}%`} icon={ClipboardList} tone={(child?.attendancePct ?? 0) >= 75 ? "green" : "amber"} />
        <KpiCard label="CGPA" value={child?.cgpa ?? "—"} icon={Award} />
        <KpiCard label="Backlogs" value={child?.backlogs ?? 0} icon={BookMarked} />
        <KpiCard label="Fee Due" value="₹60,000" icon={Wallet} tone="amber" />
      </div>
      <Card className="mt-6 p-5">
        <h3 className="mb-3 text-sm font-semibold text-lnx-navy-800">Recent Announcements</h3>
        <p className="text-xs text-muted-foreground">Mid-sem exam schedule published · 2 days ago</p>
      </Card>
    </div>
  );
}

function HodDashboard() {
  const { user } = useAccess();
  const students = useUsersStore(s => s.users.filter(u => u.role === "student" && u.department === user?.department));
  const faculty = useUsersStore(s => s.users.filter(u => (u.role === "faculty" || u.role === "lab_faculty") && u.department === user?.department));
  return (
    <div>
      <PageHeader title={`${user?.department} Department`} subtitle={`HOD · ${user?.firstName} ${user?.lastName}`} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Students" value={students.length} icon={GraduationCap} />
        <KpiCard label="Faculty" value={faculty.length} icon={Users} />
        <KpiCard label="Avg Attendance" value="84%" icon={ClipboardList} tone="green" />
        <KpiCard label="Pending Approvals" value="4" icon={ClipboardList} tone="amber" />
      </div>
    </div>
  );
}

function TpoDashboard() {
  const drives = usePlacementStore(s => s.drives);
  const offers = usePlacementStore(s => s.offers);
  return (
    <div>
      <PageHeader title="Placement Cell" subtitle="Live drives, candidate progress and offers" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Active Drives" value={drives.filter(d => d.status === "active").length} icon={Briefcase} />
        <KpiCard label="Upcoming" value={drives.filter(d => d.status === "upcoming").length} icon={Calendar} />
        <KpiCard label="Offers YTD" value={offers.length} icon={BadgeCheck} tone="green" />
        <KpiCard label="Highest Package" value="₹22 LPA" icon={Award} tone="teal" />
      </div>
    </div>
  );
}

function FinanceDashboard() {
  const ledger = useFinanceStore(s => s.ledger);
  const collected = ledger.reduce((a, l) => a + (l.payment ?? 0), 0);
  return (
    <div>
      <PageHeader title="Finance" subtitle="Collections, defaulters and scholarships" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Collected (30d)" value={`₹${(collected/100000).toFixed(2)}L`} icon={Wallet} tone="green" />
        <KpiCard label="Pending Dues" value="₹12.4L" icon={Wallet} tone="amber" />
        <KpiCard label="Defaulters" value="38" icon={Users} tone="red" />
        <KpiCard label="Scholarships Disbursed" value="₹3.2L" icon={Award} />
      </div>
    </div>
  );
}

function ExamDashboard() {
  return (
    <div>
      <PageHeader title="Exam Cell" subtitle="Hall tickets, marks entry and result publishing" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Upcoming Exams" value="8" icon={Calendar} />
        <KpiCard label="Hall Tickets Issued" value="1,180" icon={FileText} tone="green" />
        <KpiCard label="Eligibility Blocked" value="67" icon={XCircle} tone="red" />
        <KpiCard label="Marks Entry Complete" value="78%" icon={ClipboardList} tone="amber" />
      </div>
    </div>
  );
}

function RegistrarDashboard() {
  return (
    <div>
      <PageHeader title="Registrar Office" subtitle="Admissions, documents and enrolments" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Applications" value="412" icon={FileText} />
        <KpiCard label="Documents Pending" value="34" icon={ClipboardList} tone="amber" />
        <KpiCard label="Enrolled YTD" value="287" icon={GraduationCap} tone="green" />
        <KpiCard label="Document Requests" value="18" icon={FileText} />
      </div>
    </div>
  );
}

function GenericDashboard() {
  const { user } = useAccess();
  return (
    <div>
      <PageHeader title={`Welcome, ${user?.firstName}`} subtitle={ROLE_LABEL[user?.role ?? "clerk"]} />
      <Card className="p-6 text-sm text-muted-foreground">Use the sidebar to navigate.</Card>
    </div>
  );
}
