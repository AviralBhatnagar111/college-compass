// Permission registry — keys + plain-language labels grouped by module
// Module key → display name + actions

export interface ActionDef { key: string; label: string; }
export interface ModuleDef { key: string; label: string; navKey?: string; actions: ActionDef[]; }

export const MODULES: ModuleDef[] = [
  { key: "admissions", label: "Admissions", navKey: "nav.people", actions: [
    { key: "admissions.view", label: "View Applications" },
    { key: "admissions.create", label: "Create" },
    { key: "admissions.edit", label: "Edit" },
    { key: "admissions.approve", label: "Approve" },
    { key: "admissions.verify_docs", label: "Document Verify" },
    { key: "admissions.generate_offer", label: "Generate Offer" },
    { key: "admissions.cancel", label: "Cancel Admission" },
  ]},
  { key: "students", label: "Students (SIS)", navKey: "nav.people", actions: [
    { key: "students.view", label: "View Basic" },
    { key: "students.view_sensitive", label: "View Sensitive Data" },
    { key: "students.view_documents", label: "View Documents" },
    { key: "students.edit", label: "Edit Allowed Fields" },
    { key: "students.manage_locked", label: "Manage Locked Fields" },
    { key: "students.bulk_upload", label: "Bulk Upload" },
    { key: "students.export", label: "Export" },
    { key: "students.deactivate", label: "Deactivate" },
  ]},
  { key: "faculty", label: "Faculty & Staff", navKey: "nav.people", actions: [
    { key: "faculty.view", label: "View" },
    { key: "faculty.create", label: "Create" },
    { key: "faculty.edit", label: "Edit" },
    { key: "faculty.assign_subject", label: "Assign Subject" },
    { key: "faculty.assign_role", label: "Assign Role" },
    { key: "faculty.bulk_upload", label: "Bulk Upload" },
    { key: "faculty.deactivate", label: "Deactivate" },
  ]},
  { key: "curriculum", label: "Curriculum", navKey: "nav.academic", actions: [
    { key: "curriculum.view", label: "View" },
    { key: "curriculum.create", label: "Create" },
    { key: "curriculum.edit", label: "Edit" },
    { key: "curriculum.version", label: "Version Syllabus" },
    { key: "curriculum.copo", label: "CO-PO Mapping" },
    { key: "curriculum.approve", label: "Approve" },
  ]},
  { key: "timetable", label: "Timetable", navKey: "nav.academic", actions: [
    { key: "timetable.view", label: "View" },
    { key: "timetable.create", label: "Create" },
    { key: "timetable.edit", label: "Edit" },
    { key: "timetable.publish", label: "Publish" },
    { key: "timetable.substitution", label: "Approve Substitution" },
    { key: "timetable.override", label: "Conflict Override" },
  ]},
  { key: "attendance", label: "Attendance", navKey: "nav.academic", actions: [
    { key: "attendance.view", label: "View" },
    { key: "attendance.mark", label: "Mark Attendance" },
    { key: "attendance.edit", label: "Edit Same Day" },
    { key: "attendance.request_correction", label: "Request Correction" },
    { key: "attendance.approve_correction", label: "Approve Correction" },
    { key: "attendance.export", label: "Export" },
    { key: "attendance.bulk_mark", label: "Bulk Mark" },
  ]},
  { key: "lms", label: "Study Material / LMS", navKey: "nav.academic", actions: [
    { key: "lms.view", label: "View" },
    { key: "lms.upload", label: "Upload" },
    { key: "lms.edit", label: "Edit" },
    { key: "lms.publish", label: "Publish" },
    { key: "lms.delete", label: "Delete" },
    { key: "lms.discussion", label: "Manage Discussion" },
  ]},
  { key: "examination", label: "Examination", navKey: "nav.academic", actions: [
    { key: "exam.view", label: "View" },
    { key: "exam.create_pattern", label: "Create Pattern" },
    { key: "exam.schedule", label: "Schedule" },
    { key: "exam.hall_ticket", label: "Generate Hall Ticket" },
    { key: "exam.enter_marks", label: "Enter Marks" },
    { key: "exam.lock_marks", label: "Lock Marks" },
    { key: "exam.publish_result", label: "Publish Result" },
    { key: "exam.re_eval", label: "Re-eval" },
  ]},
  { key: "results", label: "Results & Transcripts", navKey: "nav.academic", actions: [
    { key: "results.view", label: "View" },
    { key: "results.generate", label: "Generate" },
    { key: "results.publish", label: "Publish" },
    { key: "results.push_nad", label: "Push to NAD" },
    { key: "results.transcript", label: "Issue Transcript" },
  ]},
  { key: "finance", label: "Fee & Finance", navKey: "nav.finance", actions: [
    { key: "finance.view", label: "View" },
    { key: "finance.heads", label: "Configure Heads" },
    { key: "finance.build_structure", label: "Build Structure" },
    { key: "finance.installments", label: "Manage Installments" },
    { key: "finance.approve_waiver", label: "Approve Waiver" },
    { key: "finance.refund", label: "Process Refund" },
    { key: "finance.ledger", label: "Manage Ledger" },
    { key: "finance.export", label: "Export" },
  ]},
  { key: "scholarship", label: "Scholarship", navKey: "nav.finance", actions: [
    { key: "scholarship.view", label: "View" },
    { key: "scholarship.schemes", label: "Manage Schemes" },
    { key: "scholarship.approve", label: "Approve" },
    { key: "scholarship.disburse", label: "Disburse" },
    { key: "scholarship.nsp_sync", label: "NSP Sync" },
  ]},
  { key: "placement", label: "Placement", navKey: "nav.placement", actions: [
    { key: "placement.view", label: "View" },
    { key: "placement.companies", label: "Manage Companies" },
    { key: "placement.drives", label: "Manage Drives" },
    { key: "placement.job_profiles", label: "Manage Job Profiles" },
    { key: "placement.mcq", label: "MCQ Assessments" },
    { key: "placement.ai_interview", label: "AI Interview" },
    { key: "placement.offers", label: "Manage Offers" },
    { key: "placement.export", label: "Export Candidates" },
  ]},
  { key: "compliance", label: "Compliance", navKey: "nav.compliance", actions: [
    { key: "compliance.view", label: "View Dashboard" },
    { key: "compliance.submit", label: "Submit Criterion Data" },
    { key: "compliance.export", label: "Export Reports" },
    { key: "compliance.evidence", label: "Upload Evidence" },
  ]},
  { key: "communication", label: "Communication", navKey: "nav.communication", actions: [
    { key: "comm.send", label: "Send Notification" },
    { key: "comm.broadcast", label: "Broadcast Email/SMS/WhatsApp" },
    { key: "comm.templates", label: "Manage Templates" },
  ]},
  { key: "hr", label: "HR (Leave / Muster / Payroll)", actions: [
    { key: "hr.view", label: "View" },
    { key: "hr.apply_leave", label: "Apply Leave" },
    { key: "hr.approve_leave", label: "Approve Leave" },
    { key: "hr.muster", label: "Manage Muster" },
    { key: "hr.payroll", label: "Process Payroll" },
  ]},
  { key: "dms", label: "Documents (DMS)", actions: [
    { key: "dms.view", label: "View" },
    { key: "dms.upload", label: "Upload" },
    { key: "dms.issue", label: "Issue Certificate" },
    { key: "dms.digilocker", label: "Push to DigiLocker / NAD" },
  ]},
  { key: "analytics", label: "Reports & Analytics", navKey: "nav.analytics", actions: [
    { key: "analytics.view", label: "View" },
    { key: "analytics.drill", label: "Drill" },
    { key: "analytics.export", label: "Export" },
    { key: "analytics.schedule", label: "Schedule" },
  ]},
  { key: "rbac", label: "Security & Access", navKey: "nav.admin", actions: [
    { key: "rbac.view_users", label: "View Users" },
    { key: "rbac.edit_users", label: "Edit Users" },
    { key: "rbac.assign_role", label: "Assign Role" },
    { key: "rbac.assign_pack", label: "Assign Pack" },
    { key: "rbac.grant_extra", label: "Grant Extra Access" },
    { key: "rbac.audit", label: "Audit" },
    { key: "rbac.approve", label: "Approve Requests" },
  ]},
];

export const SENSITIVE_GROUPS = [
  { key: "student.basic", label: "Student — Basic Profile" },
  { key: "student.academic", label: "Student — Academic Data" },
  { key: "student.academic_sensitive", label: "Student — Sensitive Academic Data" },
  { key: "student.finance", label: "Student — Finance Data" },
  { key: "student.parent_contact", label: "Student — Parent Contact" },
  { key: "student.documents", label: "Student — Documents" },
  { key: "staff.basic", label: "Staff — Basic Profile" },
  { key: "staff.contact", label: "Staff — Contact Data" },
  { key: "staff.assignment", label: "Staff — Assignment Data" },
  { key: "staff.access_meta", label: "Staff — Access Metadata" },
];

// Quick lookup
export const ACTION_BY_KEY: Record<string, { module: string; label: string }> = {};
for (const m of MODULES) for (const a of m.actions) ACTION_BY_KEY[a.key] = { module: m.label, label: a.label };

// Default Access Packs
import type { AccessPack } from "./types";

const allOfModule = (mk: string) => MODULES.find(m => m.key === mk)!.actions.map(a => a.key);
const viewOnly = MODULES.flatMap(m => m.actions.filter(a => a.key.includes(".view")).map(a => a.key));

export const DEFAULT_PACKS: AccessPack[] = [
  {
    id: "hoi_full", name: "HOI Full Access", persona: "Director / Principal",
    description: "Complete oversight across all modules including Access Control governance.",
    modules: MODULES.map(m => m.key),
    permissions: MODULES.flatMap(m => m.actions.map(a => a.key)),
    isSystem: true,
    defaultScopeLevel: "institution",
    sensitive: ["student.basic","student.academic","student.academic_sensitive","student.finance","student.parent_contact","student.documents","staff.basic","staff.contact","staff.assignment","staff.access_meta"],
  },
  {
    id: "admin_ops", name: "Admin Operations", persona: "Senior admin team",
    description: "All modules except access governance and audit.",
    modules: MODULES.filter(m => m.key !== "rbac").map(m => m.key),
    permissions: MODULES.filter(m => m.key !== "rbac").flatMap(m => m.actions.map(a => a.key)),
    isSystem: true, defaultScopeLevel: "institution",
  },
  {
    id: "registrar_core", name: "Registrar Core", persona: "Registrar Office",
    description: "Admissions, documents, scholarships, student records and broadcast communication.",
    modules: ["admissions","students","dms","scholarship","communication","results"],
    permissions: [
      ...allOfModule("admissions"), ...allOfModule("students"),
      ...allOfModule("dms"), ...allOfModule("scholarship"),
      ...allOfModule("communication"), "results.view","results.generate","results.transcript",
    ],
    isSystem: true, defaultScopeLevel: "institution",
  },
  {
    id: "hod_core", name: "HOD Core", persona: "Department Head",
    description: "Department-scoped classes, subjects, faculty, attendance approvals and internal marks lock.",
    modules: ["curriculum","timetable","attendance","students","faculty","lms","examination","results","communication","analytics","hr"],
    permissions: [
      ...allOfModule("curriculum"), "timetable.view","timetable.edit","timetable.publish","timetable.substitution",
      "attendance.view","attendance.approve_correction","attendance.export",
      "students.view","students.view_documents","students.export",
      "faculty.view","faculty.assign_subject","faculty.edit",
      ...allOfModule("lms"), "exam.view","exam.enter_marks","exam.lock_marks",
      "results.view","results.generate","comm.send","comm.broadcast","comm.templates",
      "analytics.view","analytics.drill","analytics.export",
      "hr.view","hr.approve_leave",
    ],
    isSystem: true, defaultScopeLevel: "department",
  },
  {
    id: "faculty_core", name: "Faculty Core", persona: "Subject Teacher",
    description: "Mark attendance, upload study material, enter marks, manage leaves for assigned classes.",
    modules: ["attendance","lms","examination","hr","students","communication"],
    permissions: [
      "attendance.view","attendance.mark","attendance.edit","attendance.request_correction",
      "lms.view","lms.upload","lms.edit","lms.publish","lms.discussion",
      "exam.view","exam.enter_marks",
      "hr.view","hr.apply_leave",
      "students.view","comm.send",
    ],
    isSystem: true, defaultScopeLevel: "section",
  },
  {
    id: "lab_faculty_core", name: "Lab Faculty Core", persona: "Lab Teacher",
    description: "Faculty Core plus lab manage and configure AI tests.",
    modules: ["attendance","lms","examination","hr","students","placement","communication"],
    permissions: [
      "attendance.view","attendance.mark","attendance.edit","attendance.bulk_mark",
      "lms.view","lms.upload","lms.publish","exam.view","exam.enter_marks",
      "hr.view","hr.apply_leave","students.view",
      "placement.view","placement.mcq","comm.send",
    ],
    isSystem: true, defaultScopeLevel: "section",
  },
  {
    id: "tpo_core", name: "TPO Core", persona: "Placement Office",
    description: "Full placement universe with AI assessments and interviews.",
    modules: ["placement","communication","students","analytics"],
    permissions: [
      ...allOfModule("placement"),
      "comm.send","comm.broadcast","comm.templates",
      "students.view","students.view_documents","students.export",
      "analytics.view","analytics.drill","analytics.export",
    ],
    isSystem: true, defaultScopeLevel: "institution",
  },
  {
    id: "timetable_mgr", name: "Timetable Manager", persona: "Operations",
    description: "Timetable, rooms and subjects within scope.",
    modules: ["timetable","curriculum"],
    permissions: [...allOfModule("timetable"), "curriculum.view","curriculum.edit"],
    isSystem: true, defaultScopeLevel: "department",
  },
  {
    id: "finance_core", name: "Finance Core", persona: "Finance Officer",
    description: "Fee structures, ledger, refunds and scholarship disbursement.",
    modules: ["finance","scholarship","students","analytics"],
    permissions: [
      ...allOfModule("finance"), ...allOfModule("scholarship"),
      "students.view","analytics.view","analytics.export",
    ],
    isSystem: true, defaultScopeLevel: "institution",
  },
  {
    id: "student_self", name: "Student Self-Service", persona: "Student",
    description: "Own records, study material, fees, assessments and profile.",
    modules: ["lms","placement","attendance","examination","finance"],
    permissions: [
      "lms.view","placement.view","placement.mcq","placement.ai_interview",
      "attendance.view","exam.view","results.view","finance.view",
    ],
    isSystem: true, defaultScopeLevel: "section",
  },
  {
    id: "readonly_viewer", name: "Read-Only Viewer", persona: "Auditor / Observer",
    description: "All dashboards view-only, no edit/create/delete.",
    modules: MODULES.map(m => m.key),
    permissions: viewOnly,
    isSystem: true, defaultScopeLevel: "institution",
  },
];

// Module → nav key mapping
export const NAV_PERMISSIONS: Record<string, string[]> = {
  "nav.academic": ["curriculum.view","timetable.view","attendance.view","lms.view","exam.view","results.view"],
  "nav.placement": ["placement.view"],
  "nav.people": ["students.view","faculty.view","admissions.view"],
  "nav.finance": ["finance.view","scholarship.view"],
  "nav.compliance": ["compliance.view"],
  "nav.communication": ["comm.send","comm.broadcast","comm.templates"],
  "nav.analytics": ["analytics.view"],
  "nav.admin": ["rbac.view_users","rbac.audit"],
};
