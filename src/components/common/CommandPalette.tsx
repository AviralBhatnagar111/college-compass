import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut,
} from "@/components/ui/command";
import { useUsersStore, useAcademicStore, usePlacementStore, useAuthStore } from "@/stores";
import { ROLE_LABEL } from "@/lib/types";
import { DEMO_USER_IDS } from "@/data/seed";

const PAGES: { label: string; to: string; group: string }[] = [
  { label: "Dashboard", to: "/dashboard", group: "Pages" },
  { label: "Approval Center", to: "/admin/approvals", group: "Pages" },
  { label: "My Tasks", to: "/my/tasks", group: "Pages" },
  { label: "Students", to: "/people/students", group: "Pages" },
  { label: "Faculty & Staff", to: "/people/faculty", group: "Pages" },
  { label: "Parents", to: "/people/parents", group: "Pages" },
  { label: "Attendance", to: "/academic/attendance", group: "Pages" },
  { label: "Timetable", to: "/academic/timetable", group: "Pages" },
  { label: "Examinations", to: "/academic/examinations", group: "Pages" },
  { label: "Results", to: "/academic/results", group: "Pages" },
  { label: "Fee Structures", to: "/finance/fee-structures", group: "Pages" },
  { label: "Ledger & Payments", to: "/finance/ledger", group: "Pages" },
  { label: "Defaulters", to: "/finance/defaulters", group: "Pages" },
  { label: "Scholarships", to: "/finance/scholarships", group: "Pages" },
  { label: "Budget vs Actual", to: "/finance/budget", group: "Pages" },
  { label: "Placement Drives", to: "/placement/drives", group: "Pages" },
  { label: "Placement Offers", to: "/placement/offers", group: "Pages" },
  { label: "NAAC Cockpit", to: "/compliance/naac", group: "Pages" },
  { label: "NBA", to: "/compliance/nba", group: "Pages" },
  { label: "NIRF", to: "/compliance/nirf", group: "Pages" },
  { label: "AICTE", to: "/compliance/aicte", group: "Pages" },
  { label: "IQAC", to: "/quality/iqac", group: "Pages" },
  { label: "Grievances & Feedback", to: "/quality/grievances", group: "Pages" },
  { label: "Announcements", to: "/communication/announcements", group: "Pages" },
  { label: "Reports", to: "/analytics/reports", group: "Pages" },
  { label: "Access Control", to: "/admin/access-control", group: "Pages" },
  { label: "Audit Log", to: "/admin/audit-log", group: "Pages" },
  { label: "Settings", to: "/admin/settings", group: "Pages" },
];

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const users = useUsersStore(s => s.users);
  const sections = useAcademicStore(s => s.sections);
  const drives = usePlacementStore(s => s.drives);
  const companies = usePlacementStore(s => s.companies);
  const switchRole = useAuthStore(s => s.switchRole);

  const students = useMemo(() => users.filter(u => u.role === "student").slice(0, 12), [users]);
  const faculty = useMemo(() => users.filter(u => u.role === "faculty" || u.role === "lab_faculty").slice(0, 8), [users]);

  const go = (to: string) => { onOpenChange(false); navigate({ to }); };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, students, faculty, drives, sections…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Pages">
          {PAGES.map(p => (
            <CommandItem key={p.to} onSelect={() => go(p.to)}>{p.label}<CommandShortcut>{p.to}</CommandShortcut></CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Students">
          {students.map(s => (
            <CommandItem key={s.id} onSelect={() => go(`/people/students/${s.id}`)}>
              {s.firstName} {s.lastName}
              <CommandShortcut>{s.rollNo ?? s.email}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Faculty">
          {faculty.map(f => (
            <CommandItem key={f.id} onSelect={() => go("/people/faculty")}>
              {f.firstName} {f.lastName}<CommandShortcut>{f.department}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Sections">
          {sections.map(sec => (
            <CommandItem key={sec.id} onSelect={() => go("/academic/classes")}>
              {sec.name}<CommandShortcut>{sec.strength} students</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Placement Drives">
          {drives.slice(0, 8).map(d => {
            const co = companies.find(c => c.id === d.companyId);
            return (
              <CommandItem key={d.id} onSelect={() => go(`/placement/drives/${d.id}`)}>
                {co?.name ?? "Drive"} — {d.role}<CommandShortcut>{d.package}</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandGroup heading="Switch role">
          {DEMO_USER_IDS.map(id => {
            const u = users.find(x => x.id === id);
            if (!u) return null;
            return (
              <CommandItem key={id} onSelect={() => { switchRole(id); onOpenChange(false); navigate({ to: "/dashboard" }); }}>
                {u.firstName} {u.lastName}<CommandShortcut>{ROLE_LABEL[u.role]}</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}
