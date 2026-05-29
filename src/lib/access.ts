// useAccess hook + permission helpers

import { useUsersStore, useAccessStore, useAuthStore } from "@/stores";
import { NAV_PERMISSIONS } from "@/lib/permissions";
import type { User, Scope } from "@/lib/types";

export interface AccessHelpers {
  user: User | null;
  pack: ReturnType<typeof useAccessStore.getState>["packs"][number] | null;
  can: (permission: string) => boolean;
  canSee: (navKey: string) => boolean;
  inScope: (scope: { level?: Scope["level"]; id?: string }) => boolean;
  isReadOnly: () => boolean;
  hasOverride: (permission: string) => "add" | "remove" | null;
  effectivePermissions: string[];
}

const isTempActive = (o: { expiresAt?: string }) => !o.expiresAt || new Date(o.expiresAt).getTime() > Date.now();

export const computeAccess = (user: User | null, packs: ReturnType<typeof useAccessStore.getState>["packs"]): AccessHelpers => {
  if (!user) {
    return {
      user: null, pack: null,
      can: () => false, canSee: () => false, inScope: () => false,
      isReadOnly: () => true, hasOverride: () => null, effectivePermissions: [],
    };
  }
  const pack = packs.find(p => p.id === user.packId) || null;
  const base = new Set(pack?.permissions ?? []);
  for (const o of user.overrides ?? []) {
    if (!isTempActive(o)) continue;
    if (o.mode === "add") base.add(o.permission);
    else base.delete(o.permission);
  }
  // Always grant self-service basics for students/parents
  if (user.role === "student" || user.role === "parent") {
    ["lms.view","attendance.view","exam.view","results.view","finance.view","placement.view","placement.mcq","placement.ai_interview"].forEach(p => base.add(p));
  }
  const effective = Array.from(base);

  const can = (perm: string) => base.has(perm);
  const canSee = (navKey: string) => {
    const required = NAV_PERMISSIONS[navKey] ?? [];
    if (!required.length) return true;
    return required.some(p => base.has(p));
  };
  const inScope = (s: { level?: Scope["level"]; id?: string }) => {
    if (!user.scope) return true;
    if (user.scope.level === "institution") return true;
    if (!s.id) return false;
    return user.scope.ids.includes(s.id);
  };
  const isReadOnly = () => {
    const writes = ["edit","create","mark","approve","publish","delete","disburse","refund"];
    return effective.length > 0 && !effective.some(p => writes.some(w => p.includes(w)));
  };
  const hasOverride = (perm: string) => {
    const o = (user.overrides ?? []).find(x => x.permission === perm && isTempActive(x));
    return o ? o.mode : null;
  };

  return { user, pack, can, canSee, inScope, isReadOnly, hasOverride, effectivePermissions: effective };
};

export const useAccess = (): AccessHelpers => {
  const userId = useAuthStore(s => s.currentUserId);
  const user = useUsersStore(s => userId ? s.users.find(u => u.id === userId) ?? null : null);
  const packs = useAccessStore(s => s.packs);
  return computeAccess(user, packs);
};

export const useCurrentUser = (): User | null => {
  const userId = useAuthStore(s => s.currentUserId);
  return useUsersStore(s => userId ? s.users.find(u => u.id === userId) ?? null : null);
};

// Filter a student list by current user's scope (e.g. HOD sees only their dept)
export const useStudentScope = () => {
  const { user } = useAccess();
  return (studentDept?: string, studentSection?: string) => {
    if (!user) return false;
    if (user.role === "hoi" || user.role === "registrar" || user.role === "tpo_head" || user.role === "finance_head" || user.role === "exam_head") return true;
    if (user.role === "hod" && user.scope.level === "department") return user.scope.ids.includes(studentDept ?? "");
    if (user.role === "faculty" || user.role === "lab_faculty") return !!studentSection && user.scope.ids.includes(studentSection);
    if (user.role === "student") return false; // students don't browse other students
    return true;
  };
};

export const homeRouteFor = (role: User["role"]): string => "/";
