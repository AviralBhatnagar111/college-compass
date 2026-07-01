import { createFileRoute, Outlet, redirect, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAuthStore, useUsersStore, useCommStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/common/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ROLE_LABEL } from "@/lib/types";
import { DEMO_USER_IDS, INSTITUTION } from "@/data/seed";
import { RouteErrorBoundary } from "@/components/common/RouteErrorBoundary";
import { CommandPalette, useCommandPalette } from "@/components/common/CommandPalette";
import { useTaskStore } from "@/stores/tasks";
import { useAccessStore } from "@/stores";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, BookOpen, GraduationCap, Users, Wallet, ShieldCheck,
  MessageSquare, BarChart3, Settings, Bell, Search, Plus, HelpCircle,
  LogOut, ChevronLeft, ChevronRight, UserCircle2, Calendar, ClipboardList,
  Building2, Briefcase, Bot, BadgeCheck, Lock, FileText, FolderTree,
  History, KeyRound, ListChecks, BookMarked, MonitorPlay, Award,
  Repeat, Inbox, CheckSquare,
} from "lucide-react";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    // SSR guard — checked on client too inside the component
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("lnx-auth");
      if (!raw) throw redirect({ to: "/login" });
      try {
        const data = JSON.parse(raw);
        if (!data?.state?.currentUserId) throw redirect({ to: "/login" });
      } catch { throw redirect({ to: "/login" }); }
    }
  },
  component: AppLayout,
});

const NAV: { group: string; items: { to: string; label: string; icon: any; navKey?: string }[] }[] = [
  { group: "ACADEMIC", items: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admissions", label: "Admissions", icon: UserCircle2, navKey: "nav.academic" },
    { to: "/academic/programs", label: "Programs", icon: BookOpen, navKey: "nav.academic" },
    { to: "/academic/subjects", label: "Subjects", icon: BookMarked, navKey: "nav.academic" },
    { to: "/academic/classes", label: "Classes", icon: Users, navKey: "nav.academic" },
    { to: "/academic/timetable", label: "Timetable", icon: Calendar, navKey: "nav.academic" },
    { to: "/academic/calendar", label: "Academic Calendar", icon: Calendar, navKey: "nav.academic" },
    { to: "/academic/attendance", label: "Attendance", icon: ClipboardList, navKey: "nav.academic" },
    { to: "/academic/study-material", label: "Study Material", icon: MonitorPlay, navKey: "nav.academic" },
    { to: "/academic/course-files", label: "Course Files", icon: FileText, navKey: "nav.academic" },
    { to: "/academic/library", label: "Library", icon: BookOpen, navKey: "nav.academic" },
    { to: "/academic/examinations", label: "Examinations", icon: FileText, navKey: "nav.academic" },
    { to: "/academic/results", label: "Results", icon: Award, navKey: "nav.academic" },
    { to: "/academic/certificates", label: "Certificates", icon: FileText, navKey: "nav.academic" },
  ]},
  { group: "PLACEMENT", items: [
    { to: "/placement/companies", label: "Companies", icon: Building2, navKey: "nav.placement" },
    { to: "/placement/drives", label: "Drives", icon: Briefcase, navKey: "nav.placement" },
    { to: "/placement/job-profiles", label: "Job Profiles", icon: ListChecks, navKey: "nav.placement" },
    { to: "/placement/ai-assessments", label: "AI Assessments", icon: Bot, navKey: "nav.placement" },
    { to: "/placement/ai-interviews", label: "AI Interviews", icon: MonitorPlay, navKey: "nav.placement" },
    { to: "/placement/offers", label: "Offers", icon: BadgeCheck, navKey: "nav.placement" },
  ]},
  { group: "PEOPLE", items: [
    { to: "/people/students", label: "Students", icon: GraduationCap, navKey: "nav.people" },
    { to: "/people/faculty", label: "Faculty & Staff", icon: Users, navKey: "nav.people" },
    { to: "/people/faculty-appraisal", label: "Faculty Appraisal", icon: BadgeCheck, navKey: "nav.people" },
    { to: "/people/parents", label: "Parents", icon: UserCircle2, navKey: "nav.people" },
    { to: "/people/alumni", label: "Alumni", icon: GraduationCap, navKey: "nav.people" },
  ]},
  { group: "FINANCE", items: [
    { to: "/finance/fee-structures", label: "Fee Structures", icon: Wallet, navKey: "nav.finance" },
    { to: "/finance/ledger", label: "Ledger & Payments", icon: FileText, navKey: "nav.finance" },
    { to: "/finance/budget", label: "Budget vs Actual", icon: BarChart3, navKey: "nav.finance" },
    { to: "/finance/scholarships", label: "Scholarships", icon: Award, navKey: "nav.finance" },
    { to: "/finance/defaulters", label: "Defaulters", icon: ClipboardList, navKey: "nav.finance" },
  ]},
  { group: "COMPLIANCE", items: [
    { to: "/compliance/naac", label: "NAAC Cockpit", icon: ShieldCheck, navKey: "nav.compliance" },
    { to: "/compliance/nba", label: "NBA", icon: ShieldCheck, navKey: "nav.compliance" },
    { to: "/compliance/nirf", label: "NIRF", icon: ShieldCheck, navKey: "nav.compliance" },
    { to: "/compliance/aicte", label: "AICTE", icon: ShieldCheck, navKey: "nav.compliance" },
  ]},
  { group: "QUALITY & GOVERNANCE", items: [
    { to: "/quality/iqac", label: "IQAC", icon: ShieldCheck, navKey: "nav.compliance" },
    { to: "/quality/grievances", label: "Grievances & Feedback", icon: MessageSquare, navKey: "nav.compliance" },
    { to: "/quality/research", label: "Research", icon: FileText, navKey: "nav.compliance" },
  ]},
  { group: "COMMUNICATION", items: [
    { to: "/communication/inbox", label: "Inbox", icon: MessageSquare, navKey: "nav.communication" },
    { to: "/communication/announcements", label: "Announcements", icon: Bell, navKey: "nav.communication" },
  ]},
  { group: "ANALYTICS", items: [
    { to: "/analytics/reports", label: "Reports", icon: BarChart3, navKey: "nav.analytics" },
  ]},
  { group: "ADMINISTRATION", items: [
    { to: "/admin/approvals", label: "Approval Center", icon: Inbox, navKey: "nav.admin" },
    { to: "/my/tasks", label: "My Tasks", icon: CheckSquare },
    { to: "/admin/access-control", label: "Access Control", icon: KeyRound, navKey: "nav.admin" },
    { to: "/admin/org-structure", label: "Org Structure", icon: FolderTree, navKey: "nav.admin" },
    { to: "/admin/committees", label: "Committees", icon: Users, navKey: "nav.admin" },
    { to: "/admin/hostel", label: "Hostel", icon: Building2, navKey: "nav.admin" },
    { to: "/admin/transport", label: "Transport", icon: Briefcase, navKey: "nav.admin" },
    { to: "/admin/procurement", label: "Procurement & Assets", icon: ListChecks, navKey: "nav.admin" },
    { to: "/admin/audit-log", label: "Audit Log", icon: History, navKey: "nav.admin" },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ]},
];

function AppLayout() {
  const hydrated = useHydrated();
  const collapsed = useAuthStore(s => s.sidebarCollapsed);
  const toggle = useAuthStore(s => s.toggleSidebar);
  const navigate = useNavigate();
  const { user, canSee } = useAccess();
  const pathname = useRouterState({ select: r => r.location.pathname });
  const allUsers = useUsersStore(s => s.users);
  const switchRole = useAuthStore(s => s.switchRole);
  const logout = useAuthStore(s => s.logout);
  const notifications = useCommStore(s => s.notifications).filter(n => !user || n.userId === user.id);
  const todoCount = notifications.filter(n => n.type === "todo").length;
  const myOpenTasks = useTaskStore(s => s.tasks).filter(t => t.status === "open" && (!user || t.assigneeId === user.id)).length;
  const pendingAccess = useAccessStore(s => s.requests).filter(r => r.status === "pending").length;
  const cmd = useCommandPalette();
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside
        className={cn("sticky top-0 hidden h-screen flex-col bg-sidebar text-sidebar-foreground transition-[width] md:flex",
          collapsed ? "w-16" : "w-60")}
      >
        <div className={cn("flex h-16 items-center border-b border-white/10 px-4", collapsed && "justify-center px-0")}>
          <Logo collapsed={collapsed} />
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV.map(group => {
            const items = group.items.filter(i => !i.navKey || canSee(i.navKey));
            if (!items.length) return null;
            return (
              <div key={group.group} className="mb-3">
                {!collapsed && <div className="px-4 pb-1 text-[10px] font-semibold tracking-widest text-white/40">{group.group}</div>}
                {items.map(item => {
                  const Icon = item.icon;
                  const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
                  return (
                    <Link
                      key={item.to} to={item.to}
                      className={cn(
                        "group relative flex h-10 items-center gap-3 px-4 text-sm font-medium text-white/80 transition-colors hover:bg-sidebar-hover hover:text-white",
                        active && "bg-sidebar-active text-white",
                        collapsed && "justify-center px-0",
                      )}
                    >
                      {active && <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-lnx-teal-100" />}
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-[11px] text-white/40">
          <button onClick={toggle} className="rounded p-1 hover:bg-white/10" aria-label="Toggle sidebar">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          {!collapsed && <span>v1.0 · {INSTITUTION.short}</span>}
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-card px-4">
          <div className="hidden min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground md:flex">
            <Link to="/dashboard" className="hover:text-lnx-navy-800">Home</Link>
            {pathname !== "/dashboard" && (
              <>
                <span>/</span>
                <span className="truncate text-lnx-navy-800">{pathname.split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g," ")}</span>
              </>
            )}
          </div>
          <div className="relative flex-1 md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search students, faculty, classes, drives…  ⌘K" className="pl-9" />
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Repeat className="h-4 w-4" /> <span className="hidden sm:inline">{ROLE_LABEL[user.role]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Switch demo role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {DEMO_USER_IDS.map(id => {
                  const u = allUsers.find(x => x.id === id);
                  if (!u) return null;
                  return (
                    <DropdownMenuItem key={id} onClick={() => { switchRole(id); navigate({ to: "/dashboard" }); }}>
                      <Avatar initials={u.initials} color={u.avatarColor} size="xs" className="mr-2" />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{u.firstName} {u.lastName}</span>
                        <span className="text-[10px] text-muted-foreground">{ROLE_LABEL[u.role]}{u.department ? ` · ${u.department}` : ""}</span>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon"><Plus className="h-4 w-4" /></Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {todoCount > 0 && <Badge className="absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[9px]">{todoCount}</Badge>}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="border-b p-3 text-sm font-semibold text-lnx-navy-800">Notifications</div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 && <div className="p-6 text-center text-xs text-muted-foreground">You're all caught up.</div>}
                  {notifications.map(n => (
                    <Link key={n.id} to={n.route ?? "/dashboard"} className="block border-b p-3 text-sm hover:bg-accent">
                      <div className="font-medium text-lnx-navy-800">{n.title}</div>
                      <div className="text-xs text-muted-foreground">{n.meta}</div>
                    </Link>
                  ))}
                </div>
                <Link to="/communication/inbox" className="block border-t p-2 text-center text-xs font-medium text-lnx-teal-500 hover:bg-accent">View all</Link>
              </PopoverContent>
            </Popover>

            <Button variant="ghost" size="icon"><HelpCircle className="h-4 w-4" /></Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full"><Avatar initials={user.initials} color={user.avatarColor} size="sm" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2 text-xs">
                  <div className="font-semibold text-lnx-navy-800">{user.firstName} {user.lastName}</div>
                  <div className="text-muted-foreground">{user.email}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/profile"><UserCircle2 className="mr-2 h-4 w-4" /> Profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/admin/settings"><Settings className="mr-2 h-4 w-4" /> Settings</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); navigate({ to: "/login" }); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-6">
          <RouteErrorBoundary key={pathname}>
            <Outlet />
          </RouteErrorBoundary>
        </main>
      </div>
    </div>
  );
}
