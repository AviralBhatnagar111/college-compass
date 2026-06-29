// Persisted decisions for HOI dashboard approval queues + dismissed risk flags.
// Keeps the queues and tiles in sync with audit/notifications after Approve/Reject.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Decision = "approved" | "rejected";

export interface QueueDecision {
  reqId: string;
  decision: Decision;
  note: string;
  byUserId: string;
  at: string;
}

interface DashApprovalStore {
  decisions: Record<string, QueueDecision>;
  dismissedFlags: Record<string, string>; // flagId -> ISO date dismissed
  decide: (d: QueueDecision) => void;
  dismissFlag: (flagId: string) => void;
  reset: () => void;
}

export const useDashApprovalStore = create<DashApprovalStore>()(
  persist(
    (set) => ({
      decisions: {},
      dismissedFlags: {},
      decide: (d) => set((s) => ({ decisions: { ...s.decisions, [d.reqId]: d } })),
      dismissFlag: (flagId) =>
        set((s) => ({ dismissedFlags: { ...s.dismissedFlags, [flagId]: new Date().toISOString() } })),
      reset: () => set({ decisions: {}, dismissedFlags: {} }),
    }),
    { name: "lnx-dash-approvals", storage: createJSONStorage(() => localStorage) }
  )
);
