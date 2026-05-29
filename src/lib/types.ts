// Core domain types for LearnNowX

export type RoleKey =
  | "hoi" | "registrar" | "tpo_head" | "finance_head" | "exam_head"
  | "hod" | "faculty" | "lab_faculty" | "timetable_coord" | "clerk"
  | "student" | "parent";

export const ROLE_LABEL: Record<RoleKey, string> = {
  hoi: "HOI / Director",
  registrar: "Registrar",
  tpo_head: "TPO Head",
  finance_head: "Finance Head",
  exam_head: "Exam Cell Head",
  hod: "HOD",
  faculty: "Faculty",
  lab_faculty: "Lab Faculty",
  timetable_coord: "Timetable Coordinator",
  clerk: "Clerk / Ops Admin",
  student: "Student",
  parent: "Parent",
};

export type PackId =
  | "hoi_full" | "admin_ops" | "registrar_core" | "hod_core"
  | "faculty_core" | "lab_faculty_core" | "tpo_core" | "timetable_mgr"
  | "finance_core" | "student_self" | "readonly_viewer";

export interface AccessPack {
  id: PackId | string;
  name: string;
  persona: string;
  description: string;
  modules: string[];        // module keys
  permissions: string[];    // permission keys
  isSystem: boolean;
  isEdited?: boolean;
  isArchived?: boolean;
  assignedCount?: number;
  sensitive?: string[];     // sensitive data groups
  defaultScopeLevel?: ScopeLevel;
}

export type ScopeLevel = "institution" | "campus" | "department" | "program" | "batch" | "section" | "subject";

export interface Scope {
  level: ScopeLevel;
  ids: string[]; // ids relative to level (e.g. ['CSE'] or ['CSE-A1','CSE-A2'])
  label?: string;
}

export interface Override {
  permission: string;
  mode: "add" | "remove";
  reason?: string;
  grantedBy?: string;
  grantedAt?: string;
  expiresAt?: string;       // makes it temporary
  sensitive?: boolean;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: RoleKey;
  designation?: string;
  department?: string;
  employeeId?: string;
  rollNo?: string;
  packId?: PackId | string;
  scope: Scope;
  overrides: Override[];
  status: "active" | "inactive" | "pending";
  loginMethod: "password" | "otp" | "sso";
  avatarColor?: string;
  initials?: string;
  // student-only
  programId?: string;
  batch?: string;
  sectionId?: string;
  cgpa?: number;
  attendancePct?: number;
  backlogs?: number;
  parentId?: string;
  childId?: string;
  // metadata
  editedByAdmin?: boolean;
  restoredToDefault?: boolean;
  needsReview?: boolean;
  hasSensitiveAccess?: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface Department { id: string; name: string; hodId?: string; programs: string[]; }
export interface Program { id: string; name: string; departmentId: string; durationYears: number; }
export interface Subject { id: string; code: string; name: string; departmentId: string; credits: number; ltp: string; semester: number; }
export interface Section { id: string; name: string; programId: string; batch: string; strength: number; }
export interface Room { id: string; name: string; type: "Lecture" | "Lab" | "Auditorium" | "Seminar"; capacity: number; }

export interface TimetableSlot {
  id: string; sectionId: string; day: number; slot: number;
  subjectId?: string; facultyId?: string; roomId?: string;
}

export interface AttendanceRecord {
  id: string; sectionId: string; subjectId: string; facultyId: string;
  date: string; slot: number;
  marks: Record<string, "P" | "A" | "L" | "ML">; // studentId -> status
  submittedAt: string;
}

export interface Company { id: string; name: string; sector: string; tier: "Tier 1" | "Tier 2" | "Tier 3"; }
export interface Drive {
  id: string; companyId: string; role: string; package: string;
  branches: string[]; cgpaCutoff: number; backlogsAllowed: boolean;
  startDate: string; endDate: string;
  appliedIds: string[]; shortlistedIds: string[]; selectedIds: string[];
  jobProfileId?: string;
  status: "upcoming" | "active" | "completed";
}
export interface JobProfile { id: string; name: string; description: string; mcqBank: number; aiQuestions: number; }
export interface McqAttempt { id: string; studentId: string; driveId?: string; jobProfileId?: string; score: number; total: number; attemptedAt: string; }
export interface AiInterviewAttempt { id: string; studentId: string; driveId?: string; jobProfileId?: string; score: number; durationMins: number; language: string; }
export interface Offer { id: string; studentId: string; companyId: string; driveId: string; package: string; status: "pending" | "accepted" | "declined"; date: string; }

export interface FeeStructure { id: string; name: string; programId: string; batch: string; total: number; installments: { label: string; amount: number; dueDate: string }[]; assignedCount: number; }
export interface LedgerEntry { id: string; studentId: string; date: string; head: string; charge?: number; payment?: number; scholarship?: number; waiver?: number; refund?: number; balance: number; reason?: string; }
export interface Scholarship { id: string; name: string; scheme: string; amount: number; appliedCount: number; approvedCount: number; disbursedCount: number; }

export interface Announcement { id: string; title: string; body: string; audience: string[]; channels: string[]; sent: number; delivered: number; opened: number; sentAt: string; }
export interface InboxMessage { id: string; from: string; subject: string; snippet: string; body: string; folder: "todo" | "awaiting" | "recent" | "archived"; receivedAt: string; actionRoute?: string; actionLabel?: string; read?: boolean; }
export interface Notification { id: string; userId: string; title: string; meta: string; route?: string; createdAt: string; type: "todo" | "awaiting" | "recent"; }

export interface AccessRequest {
  id: string; userId: string; requestedBy: string; requestedAt: string;
  change: string; reason: string; validUntil?: string;
  status: "pending" | "approved" | "rejected"; resolvedBy?: string; resolvedAt?: string; comment?: string;
}

export interface AuditEntry {
  id: string; at: string; actorId: string; targetId?: string;
  action: string; module: string;
  before?: any; after?: any; reason?: string;
}

export interface ComplianceCriterion {
  id: string; framework: "NAAC" | "NBA" | "NIRF" | "AICTE";
  number: string; name: string; readiness: number; status: "red" | "amber" | "green";
  sources: { name: string; ok: boolean }[];
  gaps: string[];
}
