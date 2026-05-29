// Zustand stores — persisted to localStorage

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  User, AccessPack, AccessRequest, AuditEntry, Notification, InboxMessage,
  Department, Program, Subject, Section, Room, TimetableSlot, AttendanceRecord,
  Company, Drive, JobProfile, McqAttempt, AiInterviewAttempt, Offer,
  FeeStructure, LedgerEntry, Scholarship, Announcement, ComplianceCriterion,
} from "@/lib/types";
import * as seed from "@/data/seed";

// ─── Auth ────────────────────────────────────────────────────────────────
interface AuthState {
  currentUserId: string | null;
  sidebarCollapsed: boolean;
  login: (userId: string) => void;
  logout: () => void;
  switchRole: (userId: string) => void;
  toggleSidebar: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUserId: null,
      sidebarCollapsed: false,
      login: (userId) => set({ currentUserId: userId }),
      logout: () => set({ currentUserId: null }),
      switchRole: (userId) => set({ currentUserId: userId }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: "lnx-auth", storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as any))) }
  )
);

// ─── Users ───────────────────────────────────────────────────────────────
interface UsersState {
  users: User[];
  addUser: (u: User) => void;
  updateUser: (id: string, patch: Partial<User>) => void;
  removeUser: (id: string) => void;
  getUser: (id: string) => User | undefined;
}

export const useUsersStore = create<UsersState>()(
  persist(
    (set, get) => ({
      users: seed.seedUsers,
      addUser: (u) => set((s) => ({ users: [...s.users, u] })),
      updateUser: (id, patch) =>
        set((s) => ({ users: s.users.map(u => u.id === id ? { ...u, ...patch, updatedAt: new Date().toISOString() } : u) })),
      removeUser: (id) => set((s) => ({ users: s.users.filter(u => u.id !== id) })),
      getUser: (id) => get().users.find(u => u.id === id),
    }),
    { name: "lnx-users" }
  )
);

// ─── Access ──────────────────────────────────────────────────────────────
interface AccessState {
  packs: AccessPack[];
  requests: AccessRequest[];
  audit: AuditEntry[];
  addPack: (p: AccessPack) => void;
  updatePack: (id: string, patch: Partial<AccessPack>) => void;
  clonePack: (id: string) => string | null;
  archivePack: (id: string) => void;
  addRequest: (r: AccessRequest) => void;
  resolveRequest: (id: string, status: "approved" | "rejected", comment: string, actorId: string) => void;
  addAudit: (a: AuditEntry) => void;
}

export const useAccessStore = create<AccessState>()(
  persist(
    (set, get) => ({
      packs: seed.seedPacks,
      requests: seed.seedRequests,
      audit: seed.seedAudit,
      addPack: (p) => set((s) => ({ packs: [...s.packs, p] })),
      updatePack: (id, patch) => set((s) => ({ packs: s.packs.map(p => p.id === id ? { ...p, ...patch } : p) })),
      clonePack: (id) => {
        const orig = get().packs.find(p => p.id === id);
        if (!orig) return null;
        const newId = `${id}_copy_${Date.now().toString(36)}`;
        const copy: AccessPack = { ...orig, id: newId, name: orig.name + " (Copy)", isSystem: false, assignedCount: 0 };
        set((s) => ({ packs: [...s.packs, copy] }));
        return newId;
      },
      archivePack: (id) => set((s) => ({ packs: s.packs.map(p => p.id === id ? { ...p, isArchived: true } : p) })),
      addRequest: (r) => set((s) => ({ requests: [r, ...s.requests] })),
      resolveRequest: (id, status, comment, actorId) =>
        set((s) => ({
          requests: s.requests.map(r => r.id === id ? { ...r, status, comment, resolvedBy: actorId, resolvedAt: new Date().toISOString() } : r),
        })),
      addAudit: (a) => set((s) => ({ audit: [a, ...s.audit].slice(0, 500) })),
    }),
    { name: "lnx-access" }
  )
);

// ─── Academic ────────────────────────────────────────────────────────────
interface AcademicState {
  departments: Department[];
  programs: Program[];
  sections: Section[];
  subjects: Subject[];
  rooms: Room[];
  timetable: TimetableSlot[];
  attendance: AttendanceRecord[];
  saveAttendance: (record: AttendanceRecord) => void;
  updateTimetableSlot: (id: string, patch: Partial<TimetableSlot>) => void;
}

export const useAcademicStore = create<AcademicState>()(
  persist(
    (set) => ({
      departments: seed.seedDepartments,
      programs: seed.seedPrograms,
      sections: seed.seedSections,
      subjects: seed.seedSubjects,
      rooms: seed.seedRooms,
      timetable: seed.seedTimetable,
      attendance: seed.seedAttendance,
      saveAttendance: (r) => set((s) => {
        const filtered = s.attendance.filter(a => !(a.sectionId === r.sectionId && a.subjectId === r.subjectId && a.date === r.date && a.slot === r.slot));
        return { attendance: [r, ...filtered] };
      }),
      updateTimetableSlot: (id, patch) => set((s) => ({ timetable: s.timetable.map(t => t.id === id ? { ...t, ...patch } : t) })),
    }),
    { name: "lnx-academic" }
  )
);

// ─── Placement ───────────────────────────────────────────────────────────
interface PlacementState {
  companies: Company[];
  drives: Drive[];
  jobProfiles: JobProfile[];
  mcq: McqAttempt[];
  ai: AiInterviewAttempt[];
  offers: Offer[];
  addDrive: (d: Drive) => void;
  addCompany: (c: Company) => void;
  addMcqAttempt: (a: McqAttempt) => void;
}

export const usePlacementStore = create<PlacementState>()(
  persist(
    (set) => ({
      companies: seed.seedCompanies,
      drives: seed.seedDrives,
      jobProfiles: seed.seedJobProfiles,
      mcq: seed.seedMcq,
      ai: seed.seedAi,
      offers: seed.seedOffers,
      addDrive: (d) => set((s) => ({ drives: [d, ...s.drives] })),
      addCompany: (c) => set((s) => ({ companies: [c, ...s.companies] })),
      addMcqAttempt: (a) => set((s) => ({ mcq: [a, ...s.mcq] })),
    }),
    { name: "lnx-placement" }
  )
);

// ─── Finance ─────────────────────────────────────────────────────────────
interface FinanceState {
  structures: FeeStructure[];
  ledger: LedgerEntry[];
  scholarships: Scholarship[];
  addStructure: (f: FeeStructure) => void;
  addLedger: (e: LedgerEntry) => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      structures: seed.seedFeeStructures,
      ledger: seed.seedLedger,
      scholarships: seed.seedScholarships,
      addStructure: (f) => set((s) => ({ structures: [f, ...s.structures] })),
      addLedger: (e) => set((s) => ({ ledger: [e, ...s.ledger] })),
    }),
    { name: "lnx-finance" }
  )
);

// ─── Communication ───────────────────────────────────────────────────────
interface CommState {
  announcements: Announcement[];
  notifications: Notification[];
  inbox: InboxMessage[];
  addAnnouncement: (a: Announcement) => void;
  addNotification: (n: Notification) => void;
  markRead: (id: string) => void;
  moveMessage: (id: string, folder: InboxMessage["folder"]) => void;
}

export const useCommStore = create<CommState>()(
  persist(
    (set) => ({
      announcements: seed.seedAnnouncements,
      notifications: seed.seedNotifications,
      inbox: seed.seedInbox,
      addAnnouncement: (a) => set((s) => ({ announcements: [a, ...s.announcements] })),
      addNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications] })),
      markRead: (id) => set((s) => ({ inbox: s.inbox.map(m => m.id === id ? { ...m, read: true } : m) })),
      moveMessage: (id, folder) => set((s) => ({ inbox: s.inbox.map(m => m.id === id ? { ...m, folder } : m) })),
    }),
    { name: "lnx-comm" }
  )
);

// ─── Compliance ──────────────────────────────────────────────────────────
interface ComplianceState {
  criteria: ComplianceCriterion[];
}

export const useComplianceStore = create<ComplianceState>()(
  persist(
    () => ({
      criteria: seed.seedCompliance,
    }),
    { name: "lnx-compliance" }
  )
);

// ─── Reset helper ────────────────────────────────────────────────────────
export const resetAllData = () => {
  if (typeof window === "undefined") return;
  ["lnx-auth","lnx-users","lnx-access","lnx-academic","lnx-placement","lnx-finance","lnx-comm","lnx-compliance"].forEach(k => localStorage.removeItem(k));
  window.location.href = "/login";
};
