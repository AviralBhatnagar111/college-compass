// Institutional policy thresholds driving cross-module behavior.
// Persisted to localStorage so Settings changes survive reload.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Policies {
  minAttendancePct: number;        // examinations eligibility
  lateFeeAfterDays: number;        // finance defaulter cutoff
  lockMarksAfterPublish: boolean;  // exam cell
  requireReasonForAccessChange: boolean; // admin/access
  sensitiveDataAudit: boolean;
  autoExpireTempAccess: boolean;
  placementTargetPct: number;      // TPO season target
}

interface PolicyStore {
  policies: Policies;
  set: <K extends keyof Policies>(k: K, v: Policies[K]) => void;
  reset: () => void;
}

const DEFAULT: Policies = {
  minAttendancePct: 75,
  lateFeeAfterDays: 15,
  lockMarksAfterPublish: true,
  requireReasonForAccessChange: true,
  sensitiveDataAudit: true,
  autoExpireTempAccess: true,
  placementTargetPct: 76,
};

export const usePolicyStore = create<PolicyStore>()(
  persist(
    (set) => ({
      policies: DEFAULT,
      set: (k, v) => set((s) => ({ policies: { ...s.policies, [k]: v } })),
      reset: () => set({ policies: DEFAULT }),
    }),
    { name: "lnx-policies", storage: createJSONStorage(() => localStorage) }
  )
);
