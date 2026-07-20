// Attendance approval workflow — pending submissions, corrections, faculty leaves.
// Faculty writes here first; HOD approves and only then does saveAttendanceCascade
// publish to academicStore.attendance (which students / parents read).

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type SubmissionStatus =
  | "draft" | "pending" | "approved" | "rejected" | "returned" | "corrected" | "locked";

export interface AttendanceSubmission {
  id: string;
  sectionId: string;
  subjectId: string;
  facultyId: string;
  facultyName?: string;
  date: string;
  slot: number;
  startTime: string;
  endTime: string;
  roomId?: string;
  isLab?: boolean;
  batch?: string;
  marks: Record<string, "P" | "A" | "L" | "ML">;
  totalStudents: number;
  submittedAt: string;
  status: SubmissionStatus;
  decidedBy?: string;
  decidedAt?: string;
  decisionNote?: string;
}

export type CorrectionType =
  | "medical" | "technical" | "wrong_student" | "late_entry" | "duplicate" | "other";

export interface AttendanceCorrection {
  id: string;
  raisedBy: string;              // userId who raised it (student, parent, faculty)
  raisedByRole: "student" | "parent" | "faculty" | "lab_faculty";
  studentId: string;
  studentName: string;
  rollNo?: string;
  sectionId: string;
  subjectId: string;
  facultyId: string;
  facultyName: string;
  date: string;
  slot: number;
  startTime: string;
  endTime: string;
  currentMark: "P" | "A" | "L" | "ML";
  correctionType: CorrectionType;
  reason: string;
  attachments?: string[];
  raisedAt: string;
  status: "pending_faculty" | "pending_hod" | "approved" | "rejected";
  facultyDecision?: { by: string; at: string; note: string; approved: boolean };
  hodDecision?: { by: string; at: string; note: string; approved: boolean };
}

export interface FacultyLeave {
  id: string;
  facultyId: string;
  facultyName: string;
  department?: string;
  from: string;
  to: string;
  reason: string;
  raisedAt: string;
  status: "pending" | "approved" | "rejected";
  decidedBy?: string;
  decidedAt?: string;
  decisionNote?: string;
}

interface Store {
  submissions: AttendanceSubmission[];
  corrections: AttendanceCorrection[];
  leaves: FacultyLeave[];
  addSubmission: (s: AttendanceSubmission) => void;
  updateSubmission: (id: string, patch: Partial<AttendanceSubmission>) => void;
  addCorrection: (c: AttendanceCorrection) => void;
  updateCorrection: (id: string, patch: Partial<AttendanceCorrection>) => void;
  addLeave: (l: FacultyLeave) => void;
  updateLeave: (id: string, patch: Partial<FacultyLeave>) => void;
}

export const useAttendanceWorkflow = create<Store>()(
  persist(
    (set) => ({
      submissions: [],
      corrections: [],
      leaves: [],
      addSubmission: (s) => set((st) => ({ submissions: [s, ...st.submissions.filter(x => x.id !== s.id)] })),
      updateSubmission: (id, patch) => set((st) => ({ submissions: st.submissions.map(s => s.id === id ? { ...s, ...patch } : s) })),
      addCorrection: (c) => set((st) => ({ corrections: [c, ...st.corrections] })),
      updateCorrection: (id, patch) => set((st) => ({ corrections: st.corrections.map(c => c.id === id ? { ...c, ...patch } : c) })),
      addLeave: (l) => set((st) => ({ leaves: [l, ...st.leaves] })),
      updateLeave: (id, patch) => set((st) => ({ leaves: st.leaves.map(x => x.id === id ? { ...x, ...patch } : x) })),
    }),
    { name: "lnx-attendance-workflow-v1", storage: createJSONStorage(() => localStorage) }
  )
);

// Slot → wall-clock times used across attendance UI. Keeps HOD queue,
// faculty cards, student history and correction dialogs consistent.
export const SLOT_TIMES: { start: string; end: string }[] = [
  { start: "09:00", end: "09:55" },
  { start: "10:00", end: "10:55" },
  { start: "11:00", end: "11:55" },
  { start: "12:00", end: "12:55" },
  { start: "14:00", end: "14:55" },
  { start: "15:00", end: "15:55" },
];
export const slotTime = (slot: number) => SLOT_TIMES[slot] ?? { start: "—", end: "—" };
