// LearnNowX seed data — Bharat Institute of Engineering & Management

import type {
  User, Department, Program, Subject, Section, Room, Company, Drive,
  JobProfile, McqAttempt, AiInterviewAttempt, Offer, FeeStructure,
  LedgerEntry, Scholarship, Announcement, AccessRequest, AuditEntry,
  Notification, InboxMessage, TimetableSlot, AttendanceRecord,
  ComplianceCriterion,
} from "@/lib/types";
import { DEFAULT_PACKS } from "@/lib/permissions";

const today = new Date();
const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
const daysAhead = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };

const palette = ["#01B6B9","#0055AD","#22C55E","#F59E0B","#EF4444","#2563EB","#8B5CF6","#EC4899"];
const initials = (a: string, b: string) => (a[0] + (b[0] ?? "")).toUpperCase();
const colorOf = (i: number) => palette[i % palette.length];

// ─── Org structure ───────────────────────────────────────────────────────
export const seedDepartments: Department[] = [
  { id: "CSE", name: "Computer Science & Engineering", hodId: "u_hod_cse", programs: ["P_CSE"] },
  { id: "ECE", name: "Electronics & Communication", hodId: "u_hod_ece", programs: ["P_ECE"] },
  { id: "ME",  name: "Mechanical Engineering",       hodId: "u_hod_me",  programs: ["P_ME"] },
  { id: "CIVIL", name: "Civil Engineering",           hodId: "u_hod_civil", programs: ["P_CIVIL"] },
  { id: "BIOTECH", name: "Biotechnology",             hodId: "u_hod_bio", programs: ["P_BIOTECH"] },
  { id: "MBA", name: "Management Studies",            hodId: "u_hod_mba", programs: ["P_MBA"] },
];

export const seedPrograms: Program[] = [
  { id: "P_CSE", name: "B.Tech Computer Science", departmentId: "CSE", durationYears: 4 },
  { id: "P_ECE", name: "B.Tech Electronics", departmentId: "ECE", durationYears: 4 },
  { id: "P_ME",  name: "B.Tech Mechanical", departmentId: "ME", durationYears: 4 },
  { id: "P_CIVIL", name: "B.Tech Civil", departmentId: "CIVIL", durationYears: 4 },
  { id: "P_BIOTECH", name: "B.Tech Biotechnology", departmentId: "BIOTECH", durationYears: 4 },
  { id: "P_MBA", name: "MBA", departmentId: "MBA", durationYears: 2 },
];

export const seedSections: Section[] = [
  { id: "CSE-A1", name: "CSE-A1", programId: "P_CSE", batch: "2023-27", strength: 20 },
  { id: "CSE-A2", name: "CSE-A2", programId: "P_CSE", batch: "2023-27", strength: 20 },
  { id: "ECE-B1", name: "ECE-B1", programId: "P_ECE", batch: "2023-27", strength: 30 },
  { id: "ME-C1",  name: "ME-C1",  programId: "P_ME", batch: "2023-27", strength: 25 },
  { id: "CIVIL-D1", name: "CIVIL-D1", programId: "P_CIVIL", batch: "2023-27", strength: 25 },
  { id: "BIO-E1", name: "BIO-E1", programId: "P_BIOTECH", batch: "2023-27", strength: 20 },
  { id: "MBA-F1", name: "MBA-F1", programId: "P_MBA", batch: "2025-27", strength: 0 },
];

export const seedSubjects: Subject[] = [
  { id: "SUB_DBMS", code: "CS301", name: "Database Management Systems", departmentId: "CSE", credits: 4, ltp: "3-0-2", semester: 5 },
  { id: "SUB_OS",   code: "CS302", name: "Operating Systems", departmentId: "CSE", credits: 4, ltp: "3-1-0", semester: 5 },
  { id: "SUB_MATH3", code: "MA301", name: "Mathematics III", departmentId: "CSE", credits: 3, ltp: "3-0-0", semester: 5 },
  { id: "SUB_AIML", code: "CS303", name: "AI & Machine Learning", departmentId: "CSE", credits: 4, ltp: "3-0-2", semester: 5 },
  { id: "SUB_CN",   code: "CS304", name: "Computer Networks", departmentId: "CSE", credits: 3, ltp: "3-0-0", semester: 5 },
  { id: "SUB_SE",   code: "CS305", name: "Software Engineering", departmentId: "CSE", credits: 3, ltp: "3-0-0", semester: 5 },
  { id: "SUB_VLSI", code: "EC301", name: "VLSI Design", departmentId: "ECE", credits: 4, ltp: "3-0-2", semester: 5 },
  { id: "SUB_THERMO", code: "ME301", name: "Thermodynamics", departmentId: "ME", credits: 4, ltp: "3-1-0", semester: 5 },
  { id: "SUB_STRUCT", code: "CE301", name: "Structural Analysis", departmentId: "CIVIL", credits: 4, ltp: "3-1-0", semester: 5 },
  { id: "SUB_GEN", code: "BT301", name: "Genetics", departmentId: "BIOTECH", credits: 3, ltp: "3-0-0", semester: 5 },
  { id: "SUB_MKT", code: "MBA301", name: "Marketing Management", departmentId: "MBA", credits: 3, ltp: "3-0-0", semester: 1 },
  { id: "SUB_FIN", code: "MBA302", name: "Financial Management", departmentId: "MBA", credits: 3, ltp: "3-0-0", semester: 1 },
];

export const seedRooms: Room[] = [
  { id: "LH-101", name: "LH-101", type: "Lecture", capacity: 60 },
  { id: "LH-102", name: "LH-102", type: "Lecture", capacity: 60 },
  { id: "LH-103", name: "LH-103", type: "Lecture", capacity: 60 },
  { id: "LH-104", name: "LH-104", type: "Lecture", capacity: 60 },
  { id: "LH-105", name: "LH-105", type: "Lecture", capacity: 60 },
  { id: "LH-106", name: "LH-106", type: "Lecture", capacity: 60 },
  { id: "LH-107", name: "LH-107", type: "Lecture", capacity: 60 },
  { id: "LH-108", name: "LH-108", type: "Lecture", capacity: 60 },
  { id: "LAB-201", name: "LAB-201", type: "Lab", capacity: 30 },
  { id: "LAB-202", name: "LAB-202", type: "Lab", capacity: 30 },
  { id: "AUD-1", name: "Auditorium 1", type: "Auditorium", capacity: 250 },
  { id: "SEM-1", name: "Seminar Hall 1", type: "Seminar", capacity: 80 },
];

// ─── Users ───────────────────────────────────────────────────────────────
const mkUser = (u: Partial<User> & Pick<User, "id"|"firstName"|"lastName"|"role">): User => {
  const idx = parseInt(u.id.replace(/\D/g,"").slice(-2) || "0",10) || 0;
  return {
    email: `${u.firstName.toLowerCase()}.${u.lastName.toLowerCase()}@bharatedu.in`,
    phone: "+91 98" + String(1000000 + idx * 137).slice(0,8),
    designation: "",
    department: undefined,
    packId: undefined,
    scope: { level: "institution", ids: [] },
    overrides: [],
    status: "active",
    loginMethod: "password",
    avatarColor: colorOf(idx),
    initials: initials(u.firstName, u.lastName),
    createdAt: daysAgo(420),
    updatedAt: daysAgo(10),
    ...u,
  } as User;
};

export const seedLeaders: User[] = [
  mkUser({ id: "u_hoi", firstName: "Rajeshwari", lastName: "Krishnan", role: "hoi", designation: "Director", packId: "hoi_full" }),
  mkUser({ id: "u_registrar", firstName: "Suresh", lastName: "Iyer", role: "registrar", designation: "Registrar", packId: "registrar_core" }),
  mkUser({ id: "u_tpo", firstName: "Vikram", lastName: "Bhardwaj", role: "tpo_head", designation: "TPO Head", packId: "tpo_core" }),
  mkUser({ id: "u_finance", firstName: "Priya", lastName: "Deshmukh", role: "finance_head", designation: "Finance Head", packId: "finance_core" }),
  mkUser({ id: "u_exam", firstName: "Anand", lastName: "Joshi", role: "exam_head", designation: "Exam Cell Head", packId: "admin_ops" }),
];

export const seedHods: User[] = [
  mkUser({ id: "u_hod_cse", firstName: "Aarti", lastName: "Sharma", role: "hod", designation: "HOD CSE", department: "CSE", packId: "hod_core", scope: { level: "department", ids: ["CSE"] } }),
  mkUser({ id: "u_hod_ece", firstName: "Manoj", lastName: "Kulkarni", role: "hod", designation: "HOD ECE", department: "ECE", packId: "hod_core", scope: { level: "department", ids: ["ECE"] } }),
  mkUser({ id: "u_hod_me", firstName: "Rohan", lastName: "Pandey", role: "hod", designation: "HOD ME", department: "ME", packId: "hod_core", scope: { level: "department", ids: ["ME"] },
    overrides: [{ permission: "attendance.export", mode: "add", reason: "semester report", grantedBy: "u_hoi", grantedAt: daysAgo(5) }],
    editedByAdmin: true }),
  mkUser({ id: "u_hod_civil", firstName: "Sunita", lastName: "Reddy", role: "hod", designation: "HOD CIVIL", department: "CIVIL", packId: "hod_core", scope: { level: "department", ids: ["CIVIL"] } }),
  mkUser({ id: "u_hod_bio", firstName: "Sneha", lastName: "Patil", role: "hod", designation: "HOD BIOTECH", department: "BIOTECH", packId: "hod_core", scope: { level: "department", ids: ["BIOTECH"] } }),
  mkUser({ id: "u_hod_mba", firstName: "Rajeev", lastName: "Khanna", role: "hod", designation: "HOD MBA", department: "MBA", packId: "hod_core", scope: { level: "department", ids: ["MBA"] } }),
];

export const seedFaculty: User[] = [
  mkUser({ id: "u_fac_anjali", firstName: "Anjali", lastName: "Sharma", role: "faculty", designation: "Asst. Professor", department: "CSE", packId: "faculty_core",
    scope: { level: "section", ids: ["CSE-A1","CSE-A2"], label: "CSE-A1, CSE-A2 / DBMS" } }),
  mkUser({ id: "u_fac_ravi", firstName: "Ravi", lastName: "Verma", role: "lab_faculty", designation: "Lab Faculty", department: "CSE", packId: "lab_faculty_core",
    scope: { level: "section", ids: ["CSE-A1","CSE-A2"] } }),
  mkUser({ id: "u_fac_meena", firstName: "Meena", lastName: "Iyer", role: "faculty", designation: "Asst. Professor", department: "CSE", packId: "faculty_core", scope: { level: "section", ids: ["CSE-A1","CSE-A2"] } }),
  mkUser({ id: "u_fac_arjun", firstName: "Arjun", lastName: "Nair", role: "faculty", designation: "Asst. Professor", department: "CSE", packId: "faculty_core", scope: { level: "section", ids: ["CSE-A1"] } }),
  mkUser({ id: "u_fac_neha", firstName: "Neha", lastName: "Gupta", role: "faculty", designation: "Asst. Professor", department: "CSE", packId: "faculty_core", scope: { level: "section", ids: ["CSE-A2"] } }),
  mkUser({ id: "u_fac_sandeep", firstName: "Sandeep", lastName: "Rao", role: "faculty", designation: "Asso. Professor", department: "ECE", packId: "faculty_core", scope: { level: "section", ids: ["ECE-B1"] } }),
  mkUser({ id: "u_fac_kiran", firstName: "Kiran", lastName: "Bhat", role: "faculty", designation: "Asst. Professor", department: "ECE", packId: "faculty_core", scope: { level: "section", ids: ["ECE-B1"] } }),
  mkUser({ id: "u_fac_deepa", firstName: "Deepa", lastName: "Mishra", role: "faculty", designation: "Asst. Professor", department: "ME", packId: "faculty_core", scope: { level: "section", ids: ["ME-C1"] } }),
  mkUser({ id: "u_fac_pavan", firstName: "Pavan", lastName: "Yadav", role: "faculty", designation: "Asst. Professor", department: "CIVIL", packId: "faculty_core", scope: { level: "section", ids: ["CIVIL-D1"] } }),
  mkUser({ id: "u_fac_shilpa", firstName: "Shilpa", lastName: "Menon", role: "faculty", designation: "Asst. Professor", department: "BIOTECH", packId: "faculty_core", scope: { level: "section", ids: ["BIO-E1"] } }),
  mkUser({ id: "u_fac_rakesh", firstName: "Rakesh", lastName: "Naidu", role: "faculty", designation: "Asst. Professor", department: "ME", packId: "faculty_core", scope: { level: "section", ids: ["ME-C1"] } }),
  mkUser({ id: "u_fac_lab2", firstName: "Pooja", lastName: "Joshi", role: "lab_faculty", designation: "Lab Faculty", department: "ECE", packId: "lab_faculty_core", scope: { level: "section", ids: ["ECE-B1"] } }),
  mkUser({ id: "u_fac_ramesh", firstName: "Ramesh", lastName: "Krishnan", role: "faculty", designation: "Asso. Professor", department: "CSE", packId: "faculty_core", scope: { level: "section", ids: ["CSE-A1","CSE-A2"] } }),
  mkUser({ id: "u_fac_lata", firstName: "Lata", lastName: "Desai", role: "faculty", designation: "Asst. Professor", department: "CSE", packId: "faculty_core", scope: { level: "section", ids: ["CSE-A1"] } }),
  mkUser({ id: "u_fac_vivek", firstName: "Vivek", lastName: "Saxena", role: "faculty", designation: "Asst. Professor", department: "CSE", packId: "faculty_core", scope: { level: "section", ids: ["CSE-A2"] } }),
  mkUser({ id: "u_fac_kavita", firstName: "Kavita", lastName: "Bhatia", role: "faculty", designation: "Professor", department: "ECE", packId: "faculty_core", scope: { level: "section", ids: ["ECE-B1"] } }),
  mkUser({ id: "u_fac_ashok", firstName: "Ashok", lastName: "Tiwari", role: "faculty", designation: "Asst. Professor", department: "ECE", packId: "faculty_core", scope: { level: "section", ids: ["ECE-B1"] } }),
  mkUser({ id: "u_fac_manish", firstName: "Manish", lastName: "Agarwal", role: "faculty", designation: "Asso. Professor", department: "ME", packId: "faculty_core", scope: { level: "section", ids: ["ME-C1"] } }),
  mkUser({ id: "u_fac_smita", firstName: "Smita", lastName: "Kapoor", role: "faculty", designation: "Asst. Professor", department: "ME", packId: "faculty_core", scope: { level: "section", ids: ["ME-C1"] } }),
  mkUser({ id: "u_fac_naveen", firstName: "Naveen", lastName: "Sinha", role: "faculty", designation: "Asst. Professor", department: "CIVIL", packId: "faculty_core", scope: { level: "section", ids: ["CIVIL-D1"] } }),
  mkUser({ id: "u_fac_geetha", firstName: "Geetha", lastName: "Pillai", role: "faculty", designation: "Asso. Professor", department: "CIVIL", packId: "faculty_core", scope: { level: "section", ids: ["CIVIL-D1"] } }),
  mkUser({ id: "u_fac_rajan", firstName: "Rajan", lastName: "Bose", role: "faculty", designation: "Asst. Professor", department: "BIOTECH", packId: "faculty_core", scope: { level: "section", ids: ["BIO-E1"] } }),
  mkUser({ id: "u_fac_kavya", firstName: "Kavya", lastName: "Chatterjee", role: "faculty", designation: "Asst. Professor", department: "BIOTECH", packId: "faculty_core", scope: { level: "section", ids: ["BIO-E1"] } }),
  mkUser({ id: "u_fac_alok", firstName: "Alok", lastName: "Malhotra", role: "faculty", designation: "Professor", department: "MBA", packId: "faculty_core", scope: { level: "section", ids: ["MBA-F1"] } }),
  mkUser({ id: "u_fac_nidhi", firstName: "Nidhi", lastName: "Khurana", role: "faculty", designation: "Asst. Professor", department: "MBA", packId: "faculty_core", scope: { level: "section", ids: ["MBA-F1"] } }),
  mkUser({ id: "u_fac_lab3", firstName: "Suresh", lastName: "Patel", role: "lab_faculty", designation: "Lab Faculty", department: "ME", packId: "lab_faculty_core", scope: { level: "section", ids: ["ME-C1"] } }),
];

export const seedOps: User[] = [
  mkUser({ id: "u_tt_1", firstName: "Geeta", lastName: "Pillai", role: "timetable_coord", designation: "Timetable Coordinator", packId: "timetable_mgr", scope: { level: "institution", ids: [] },
    overrides: [{ permission: "students.view", mode: "add", reason: "year-end audit", grantedBy: "u_hoi", grantedAt: daysAgo(3), expiresAt: daysAhead(5) }] }),
  mkUser({ id: "u_tt_2", firstName: "Harish", lastName: "Kapoor", role: "timetable_coord", designation: "Timetable Coordinator", packId: "timetable_mgr" }),
  mkUser({ id: "u_clerk_1", firstName: "Asha", lastName: "Kulkarni", role: "clerk", designation: "Admin Clerk", packId: "admin_ops",
    overrides: [{ permission: "finance.view", mode: "add", reason: "ledger help", grantedBy: "u_registrar", grantedAt: daysAgo(7), expiresAt: daysAhead(12) }] }),
  mkUser({ id: "u_clerk_2", firstName: "Dinesh", lastName: "Patil", role: "clerk", designation: "Admin Clerk", packId: "admin_ops",
    overrides: [{ permission: "students.view_sensitive", mode: "add", reason: "compliance audit", grantedBy: "u_hoi", grantedAt: daysAgo(2), sensitive: true }],
    editedByAdmin: true, hasSensitiveAccess: true }),
];

// Generate students for sections
const indianFirstNames = ["Vikas","Aarav","Ananya","Rohan","Priya","Karan","Sneha","Aditya","Pooja","Rahul","Kavya","Siddharth","Tanvi","Arnav","Diya","Yash","Riya","Ishaan","Meera","Aryan","Saanvi","Kabir","Aanya","Dev","Mira","Veer","Tara","Aarush","Khushi","Arjun","Avani","Reyansh","Ira","Vivaan","Anika","Atharv","Myra","Shaurya","Sara","Krish","Navya","Aadhya","Parth","Aisha","Ojas","Pari","Hridhaan","Misha","Aarvi","Vihaan","Vanya","Eshan","Anvi","Yuvaan","Riya","Nakul","Kiara","Daksh","Inaya","Aviral","Trisha","Hriday","Anaya","Dhruv","Saira","Kabir","Vedika","Manan","Jiya","Aryan","Ahaana","Garv","Saanvi","Veer","Aadya"];
const indianLastNames = ["Chauhan","Sharma","Patel","Singh","Verma","Gupta","Reddy","Nair","Iyer","Menon","Pillai","Mishra","Yadav","Joshi","Bhat","Naidu","Rao","Pandey","Kumar","Saxena","Tiwari","Agarwal","Kapoor","Khanna","Bose","Chatterjee","Das","Ghosh","Sen","Mehta","Shah","Desai","Bhatia","Malhotra","Sinha","Khurana"];

let parentIdSeq = 1;
const parents: User[] = [];
const students: User[] = [];

const buildStudents = (sectionId: string, deptId: string, programId: string, count: number, codePrefix: string, startSeq: number) => {
  for (let i = 0; i < count; i++) {
    const seq = startSeq + i;
    const fn = i === 0 && sectionId === "CSE-A1" ? "Vikas" : indianFirstNames[(seq + i*7) % indianFirstNames.length];
    const ln = i === 0 && sectionId === "CSE-A1" ? "Chauhan" : indianLastNames[(seq + i*3) % indianLastNames.length];
    const sid = `u_stu_${deptId}_${String(seq).padStart(3,"0")}`;
    const att = 60 + ((seq * 13) % 38);
    const cgpa = +(6.5 + ((seq * 17) % 30) / 10).toFixed(2);
    const backlogs = (seq % 9 === 0) ? 1 : 0;
    const parentId = `u_par_${parentIdSeq++}`;
    const isVikas = sid === "u_stu_CSE_001";
    students.push(mkUser({
      id: sid, firstName: fn, lastName: ln, role: "student",
      designation: "Student", department: deptId, packId: "student_self",
      rollNo: `23B${codePrefix}${String(seq).padStart(3,"0")}`,
      programId, batch: "2023-27", sectionId,
      cgpa, attendancePct: att, backlogs,
      scope: { level: "section", ids: [sectionId] },
      parentId, email: `${fn.toLowerCase()}.${ln.toLowerCase()}${seq}@student.bharatedu.in`,
      childId: undefined,
    }));
    const pfn = isVikas ? "Mahesh" : indianFirstNames[(seq * 5) % indianFirstNames.length];
    parents.push(mkUser({
      id: parentId, firstName: pfn, lastName: ln, role: "parent",
      designation: "Parent", packId: "student_self",
      childId: sid, scope: { level: "section", ids: [sectionId] },
      email: `${pfn.toLowerCase()}.${ln.toLowerCase()}@parent.bharatedu.in`,
    }));
  }
};

buildStudents("CSE-A1", "CSE", "P_CSE", 20, "CSE", 1);
buildStudents("CSE-A2", "CSE", "P_CSE", 20, "CSE", 21);
buildStudents("ECE-B1", "ECE", "P_ECE", 30, "ECE", 1);
buildStudents("ME-C1",  "ME",  "P_ME",  25, "ME", 1);
buildStudents("CIVIL-D1","CIVIL","P_CIVIL", 25, "CIV", 1);
buildStudents("BIO-E1", "BIOTECH","P_BIOTECH", 20, "BT", 1);

// Special state on a couple students
students[5].editedByAdmin = true;
students[5].overrides = [{ permission: "lms.upload", mode: "add", reason: "student council role", grantedBy: "u_hoi", grantedAt: daysAgo(10) }];
students[12].needsReview = true;
students[12].packId = undefined;
students[18].restoredToDefault = true;

export const seedStudents = students;
export const seedParents = parents;

export const seedUsers: User[] = [
  ...seedLeaders, ...seedHods, ...seedFaculty, ...seedOps, ...students, ...parents,
];

// Demo role-switch chips (eleven)
export const DEMO_USER_IDS = [
  "u_hoi","u_registrar","u_tpo","u_finance","u_exam",
  "u_hod_cse","u_hod_civil","u_fac_anjali","u_fac_ravi",
  "u_stu_CSE_001","u_par_1",
];

// ─── Timetable for CSE-A1 ────────────────────────────────────────────────
const ttSubjects = ["SUB_DBMS","SUB_OS","SUB_MATH3","SUB_AIML","SUB_CN","SUB_SE"];
const ttFaculty  = ["u_fac_anjali","u_fac_meena","u_fac_arjun","u_fac_neha","u_fac_anjali","u_fac_meena"];
const ttRooms    = ["LH-101","LH-102","LH-103","LH-104","LH-105","LH-106"];
export const seedTimetable: TimetableSlot[] = [];
for (let day = 0; day < 5; day++) {
  for (let slot = 0; slot < 6; slot++) {
    const idx = (day + slot) % ttSubjects.length;
    seedTimetable.push({
      id: `tt_CSE-A1_${day}_${slot}`, sectionId: "CSE-A1", day, slot,
      subjectId: ttSubjects[idx], facultyId: ttFaculty[idx], roomId: ttRooms[idx],
    });
  }
}

// ─── Attendance for CSE-A1 over last 30 days ─────────────────────────────
export const seedAttendance: AttendanceRecord[] = [];
const cseA1Ids = students.filter(s => s.sectionId === "CSE-A1").map(s => s.id);
for (let d = 30; d > 0; d--) {
  const date = new Date(); date.setDate(date.getDate() - d);
  const day = date.getDay(); if (day === 0 || day === 6) continue;
  for (const subjId of ["SUB_DBMS","SUB_OS","SUB_MATH3","SUB_AIML"]) {
    const marks: Record<string, "P"|"A"|"L"|"ML"> = {};
    cseA1Ids.forEach((id, i) => {
      const r = (d * 7 + i * 3) % 100;
      marks[id] = r < 80 ? "P" : r < 90 ? "A" : r < 96 ? "L" : "ML";
    });
    seedAttendance.push({
      id: `att_${date.toISOString().slice(0,10)}_${subjId}`,
      sectionId: "CSE-A1", subjectId: subjId, facultyId: "u_fac_anjali",
      date: date.toISOString().slice(0,10), slot: 1, marks,
      submittedAt: iso(date),
    });
  }
}

// ─── Companies & Drives ──────────────────────────────────────────────────
export const seedCompanies: Company[] = [
  { id: "C_TCS", name: "TCS", sector: "IT Services", tier: "Tier 2" },
  { id: "C_INFY", name: "Infosys", sector: "IT Services", tier: "Tier 2" },
  { id: "C_WIPRO", name: "Wipro", sector: "IT Services", tier: "Tier 2" },
  { id: "C_CAP", name: "Capgemini", sector: "IT Services", tier: "Tier 2" },
  { id: "C_ZOMATO", name: "Zomato", sector: "Internet", tier: "Tier 1" },
  { id: "C_RZP", name: "Razorpay", sector: "Fintech", tier: "Tier 1" },
  { id: "C_MS", name: "Microsoft", sector: "Product", tier: "Tier 1" },
  { id: "C_GS", name: "Goldman Sachs", sector: "BFSI", tier: "Tier 1" },
];

export const seedJobProfiles: JobProfile[] = [
  { id: "JP_SDE", name: "Software Developer Practice", description: "DSA + DBMS + System Design fundamentals", mcqBank: 240, aiQuestions: 12 },
  { id: "JP_DA",  name: "Data Analyst Practice", description: "SQL, Python, statistics, case studies", mcqBank: 180, aiQuestions: 10 },
  { id: "JP_EMB", name: "Embedded Engineer Practice", description: "C, microcontrollers, RTOS, circuits", mcqBank: 150, aiQuestions: 10 },
];

export const seedDrives: Drive[] = [
  { id: "D_INFY_SDE", companyId: "C_INFY", role: "Systems Engineer", package: "₹4.5 LPA", branches: ["CSE","ECE","ME"], cgpaCutoff: 6.5, backlogsAllowed: false, startDate: daysAhead(7), endDate: daysAhead(14), appliedIds: students.slice(0,28).map(s=>s.id), shortlistedIds: students.slice(0,18).map(s=>s.id), selectedIds: [], jobProfileId: "JP_SDE", status: "active" },
  { id: "D_TCS_NQT", companyId: "C_TCS", role: "Digital Cadet", package: "₹7.0 LPA", branches: ["CSE","ECE"], cgpaCutoff: 7.0, backlogsAllowed: false, startDate: daysAhead(12), endDate: daysAhead(20), appliedIds: students.slice(0,22).map(s=>s.id), shortlistedIds: students.slice(0,12).map(s=>s.id), selectedIds: [], jobProfileId: "JP_SDE", status: "active" },
  { id: "D_RZP_SDE1", companyId: "C_RZP", role: "Backend Engineer I", package: "₹16 LPA", branches: ["CSE"], cgpaCutoff: 8.0, backlogsAllowed: false, startDate: daysAhead(3), endDate: daysAhead(9), appliedIds: students.slice(0,9).map(s=>s.id), shortlistedIds: students.slice(0,5).map(s=>s.id), selectedIds: [students[0].id], jobProfileId: "JP_SDE", status: "active" },
  { id: "D_MS_SDE", companyId: "C_MS", role: "SDE Intern", package: "₹1.6L/mo + ₹22 LPA PPO", branches: ["CSE"], cgpaCutoff: 8.5, backlogsAllowed: false, startDate: daysAhead(25), endDate: daysAhead(35), appliedIds: [], shortlistedIds: [], selectedIds: [], jobProfileId: "JP_SDE", status: "upcoming" },
  { id: "D_GS_ANL", companyId: "C_GS", role: "Analyst", package: "₹18 LPA", branches: ["CSE","ECE"], cgpaCutoff: 8.5, backlogsAllowed: false, startDate: daysAhead(30), endDate: daysAhead(40), appliedIds: [], shortlistedIds: [], selectedIds: [], jobProfileId: "JP_DA", status: "upcoming" },
];

export const seedMcq: McqAttempt[] = students.slice(0, 30).map((s, i) => ({
  id: `mcq_${s.id}`, studentId: s.id, driveId: "D_INFY_SDE", jobProfileId: "JP_SDE",
  score: 12 + (i * 3) % 18, total: 30, attemptedAt: daysAgo(2 + (i % 8)),
}));

export const seedAi: AiInterviewAttempt[] = students.slice(0, 18).map((s, i) => ({
  id: `ai_${s.id}`, studentId: s.id, driveId: "D_INFY_SDE", jobProfileId: "JP_SDE",
  score: 55 + (i * 4) % 40, durationMins: 12 + (i % 6), language: "English",
}));

export const seedOffers: Offer[] = [
  { id: "OFF_1", studentId: students[0].id, companyId: "C_RZP", driveId: "D_RZP_SDE1", package: "₹16 LPA", status: "accepted", date: daysAgo(4) },
  { id: "OFF_2", studentId: students[3].id, companyId: "C_INFY", driveId: "D_INFY_SDE", package: "₹4.5 LPA", status: "pending", date: daysAgo(2) },
  { id: "OFF_3", studentId: students[5].id, companyId: "C_TCS", driveId: "D_TCS_NQT", package: "₹7.0 LPA", status: "pending", date: daysAgo(1) },
];

// ─── Finance ─────────────────────────────────────────────────────────────
export const seedFeeStructures: FeeStructure[] = [
  { id: "FS_BTECH_CSE_25", name: "B.Tech CSE 2025-26", programId: "P_CSE", batch: "2025-29", total: 120000, installments: [{ label: "Installment 1", amount: 60000, dueDate: daysAhead(15) }, { label: "Installment 2", amount: 60000, dueDate: daysAhead(180) }], assignedCount: 40 },
  { id: "FS_BTECH_ECE_25", name: "B.Tech ECE 2025-26", programId: "P_ECE", batch: "2025-29", total: 110000, installments: [{ label: "Installment 1", amount: 55000, dueDate: daysAhead(15) }, { label: "Installment 2", amount: 55000, dueDate: daysAhead(180) }], assignedCount: 30 },
  { id: "FS_BTECH_ME_25", name: "B.Tech Mechanical 2025-26", programId: "P_ME", batch: "2025-29", total: 105000, installments: [{ label: "Installment 1", amount: 52500, dueDate: daysAhead(15) }, { label: "Installment 2", amount: 52500, dueDate: daysAhead(180) }], assignedCount: 25 },
  { id: "FS_BTECH_CIVIL_25", name: "B.Tech Civil 2025-26", programId: "P_CIVIL", batch: "2025-29", total: 100000, installments: [{ label: "Installment 1", amount: 50000, dueDate: daysAhead(15) }, { label: "Installment 2", amount: 50000, dueDate: daysAhead(180) }], assignedCount: 25 },
  { id: "FS_BTECH_BIO_25", name: "B.Tech Biotech 2025-26", programId: "P_BIOTECH", batch: "2025-29", total: 115000, installments: [{ label: "Installment 1", amount: 57500, dueDate: daysAhead(15) }, { label: "Installment 2", amount: 57500, dueDate: daysAhead(180) }], assignedCount: 20 },
  { id: "FS_MBA_25", name: "MBA 2025-27", programId: "P_MBA", batch: "2025-27", total: 180000, installments: [{ label: "Installment 1", amount: 90000, dueDate: daysAhead(10) }, { label: "Installment 2", amount: 90000, dueDate: daysAhead(180) }], assignedCount: 0 },
];

// 140 students. 126 paid Sem 5 tuition ₹60K each = ₹75.6L collected.
// 14 defaulters with variable balances summing to ₹8,17,489 (matches Defaulters page).
const DEFAULTER_AMOUNTS = [85000, 72000, 68000, 63000, 61000, 58000, 55000, 54000, 51000, 49000, 47000, 42000, 38000, 74489];
const _ledger: LedgerEntry[] = [];
students.forEach((stu, i) => {
  const isDefaulter = i >= students.length - 14;
  const amount = isDefaulter ? DEFAULTER_AMOUNTS[i - (students.length - 14)] : 60000;
  _ledger.push({ id: `L_${stu.id}_C`, studentId: stu.id, date: daysAgo(60), head: "Tuition Fee — Sem 5", charge: amount, balance: amount });
  if (!isDefaulter) {
    _ledger.push({ id: `L_${stu.id}_P`, studentId: stu.id, date: daysAgo(45 - (i % 30)), head: "Online Payment (Razorpay)", payment: 60000, balance: 0 });
  }
});
export const seedLedger: LedgerEntry[] = _ledger;

export const seedScholarships: Scholarship[] = [
  { id: "SCH_MERIT", name: "Merit Scholarship", scheme: "Institutional", amount: 20000, appliedCount: 24, approvedCount: 12, disbursedCount: 8 },
  { id: "SCH_NSP", name: "NSP Scholarship", scheme: "Govt - NSP", amount: 15000, appliedCount: 18, approvedCount: 10, disbursedCount: 4 },
  { id: "SCH_EWS", name: "EWS Support", scheme: "State", amount: 25000, appliedCount: 9, approvedCount: 5, disbursedCount: 3 },
  { id: "SCH_SC", name: "SC/ST Post-Matric", scheme: "Govt - State", amount: 30000, appliedCount: 14, approvedCount: 9, disbursedCount: 6 },
];

// ─── Communication ───────────────────────────────────────────────────────
// Total audience = 140 students + 140 parents + 26 staff = 306
export const seedAnnouncements: Announcement[] = [
  { id: "AN1", title: "Mid-sem schedule published", body: "Mid-semester exams begin from next Monday. Hall tickets available in student portal.", audience: ["Students","CSE","ECE","ME","CIVIL","BIOTECH"], channels: ["email","sms"], sent: 140, delivered: 138, opened: 112, sentAt: daysAgo(2) },
  { id: "AN2", title: "Razorpay drive registration", body: "Backend Engineer I role. Eligibility: CGPA >= 8.0. Apply by Friday.", audience: ["CSE - Final Year"], channels: ["email","whatsapp"], sent: 40, delivered: 40, opened: 38, sentAt: daysAgo(1) },
  { id: "AN3", title: "Library renovation", body: "Central library will be closed Sat-Sun for renovation.", audience: ["All"], channels: ["email"], sent: 306, delivered: 304, opened: 198, sentAt: daysAgo(5) },
  { id: "AN4", title: "PTM scheduled for Sat 14 Dec", body: "Parent-Teacher Meeting at 10:00 AM in respective department halls.", audience: ["Parents"], channels: ["email","sms","whatsapp"], sent: 140, delivered: 139, opened: 122, sentAt: daysAgo(3) },
];

export const seedNotifications: Notification[] = [
  { id: "N1", userId: "u_hoi", title: "3 access requests await your review", meta: "from Registrar, HOD ME, TPO", route: "/admin/access-control/requests", createdAt: daysAgo(0), type: "todo" },
  { id: "N2", userId: "u_hoi", title: "Razorpay confirmed final offer", meta: "Vikas Chauhan • ₹16 LPA", route: "/placement/offers", createdAt: daysAgo(0), type: "recent" },
  { id: "N3", userId: "u_hod_cse", title: "4 attendance corrections pending", meta: "Submitted by Anjali, Meena, Arjun", route: "/academic/attendance", createdAt: daysAgo(0), type: "todo" },
  { id: "N4", userId: "u_fac_anjali", title: "Mark DBMS attendance for CSE-A1", meta: "Slot 1 today", route: "/academic/attendance/mark", createdAt: daysAgo(0), type: "todo" },
  { id: "N5", userId: "u_fac_anjali", title: "Leave request from Vikas Chauhan", meta: "Medical leave - 2 days", route: "/communication/inbox", createdAt: daysAgo(0), type: "todo" },
  { id: "N6", userId: "u_stu_CSE_001", title: "DBMS Internal-1 result published", meta: "View grade card", route: "/", createdAt: daysAgo(0), type: "recent" },
  { id: "N7", userId: "u_stu_CSE_001", title: "Fee due in 5 days", meta: "₹60,000 — Installment 2", route: "/", createdAt: daysAgo(0), type: "todo" },
];

export const seedInbox: InboxMessage[] = [
  { id: "I1", from: "Aarti Sharma (HOD CSE)", subject: "Attendance correction request", snippet: "Please review and approve the attendance correction…", body: "I'm requesting approval for an attendance correction for CSE-A1, DBMS, dated last Tuesday. Five students were marked absent due to a system glitch.", folder: "todo", receivedAt: daysAgo(0), actionRoute: "/academic/attendance", actionLabel: "Open" },
  { id: "I2", from: "Vikram Bhardwaj (TPO)", subject: "Infosys drive logistics", snippet: "Need an additional auditorium for Infosys pre-placement talk…", body: "Need AUD-1 next Monday 10–12 for Infosys pre-placement talk. Expecting ~250 students.", folder: "todo", receivedAt: daysAgo(1) },
  { id: "I3", from: "Priya Deshmukh (Finance)", subject: "Monthly collection summary", snippet: "October collection summary attached…", body: "Collection ₹48.3L, defaulters trending down 4%. Reconciliation clean.", folder: "recent", receivedAt: daysAgo(2) },
];

// ─── Compliance ──────────────────────────────────────────────────────────
export const seedCompliance: ComplianceCriterion[] = [
  { id: "C1", framework: "NAAC", number: "1", name: "Curricular Aspects", readiness: 82, status: "green", sources: [{ name: "Curriculum module", ok: true },{ name: "CO-PO data", ok: true }], gaps: ["Updated syllabus for 2 new electives missing"] },
  { id: "C2", framework: "NAAC", number: "2", name: "Teaching-Learning & Evaluation", readiness: 71, status: "amber", sources: [{ name: "Attendance", ok: true },{ name: "Examination", ok: true },{ name: "Feedback module", ok: false }], gaps: ["Student feedback module incomplete"] },
  { id: "C3", framework: "NAAC", number: "3", name: "Research, Innovation & Extension", readiness: 58, status: "amber", sources: [{ name: "Publications log", ok: false }], gaps: ["Publication uploads pending from 14 faculty"] },
  { id: "C4", framework: "NAAC", number: "4", name: "Infrastructure & Learning Resources", readiness: 88, status: "green", sources: [{ name: "Rooms", ok: true }], gaps: [] },
  { id: "C5", framework: "NAAC", number: "5", name: "Student Support & Progression", readiness: 76, status: "amber", sources: [{ name: "Placement", ok: true }], gaps: ["Mentorship logs incomplete"] },
  { id: "C6", framework: "NAAC", number: "6", name: "Governance, Leadership & Management", readiness: 90, status: "green", sources: [{ name: "Policies", ok: true }], gaps: [] },
  { id: "C7", framework: "NAAC", number: "7", name: "Institutional Values & Best Practices", readiness: 44, status: "red", sources: [{ name: "Events log", ok: false }], gaps: ["Best practices documentation pending","Green audit not uploaded"] },
];

// ─── Access Control governance ───────────────────────────────────────────
export const seedPacks = DEFAULT_PACKS.map(p => ({
  ...p,
  assignedCount: seedUsers.filter(u => u.packId === p.id).length,
}));

export const seedRequests: AccessRequest[] = [
  { id: "REQ1", userId: "u_fac_meena", requestedBy: "u_hod_cse", requestedAt: daysAgo(1), change: "Add: Export Attendance (CSE-A2)", reason: "Sem-end audit", status: "pending" },
  { id: "REQ2", userId: "u_fac_arjun", requestedBy: "u_hod_cse", requestedAt: daysAgo(2), change: "Add: Lock Marks (DBMS)", reason: "Faculty handover", status: "pending" },
  { id: "REQ3", userId: "u_clerk_1", requestedBy: "u_registrar", requestedAt: daysAgo(3), change: "Temporary: View Finance Defaulters until next week", reason: "Reconciliation support", validUntil: daysAhead(7), status: "pending" },
  { id: "REQ4", userId: "u_tt_2", requestedBy: "u_hoi", requestedAt: daysAgo(4), change: "Expand scope to all departments", reason: "Master timetable build", status: "pending" },
];

export const seedAudit: AuditEntry[] = [
  { id: "A1", at: daysAgo(0), actorId: "u_hoi", targetId: "u_hod_me", action: "Added Override", module: "Attendance", before: { overrides: [] }, after: { overrides: [{ permission: "attendance.export", mode: "add" }] }, reason: "semester report" },
  { id: "A2", at: daysAgo(2), actorId: "u_hoi", targetId: "u_clerk_2", action: "Granted Sensitive Access", module: "Students", before: {}, after: { permission: "students.view_sensitive" }, reason: "compliance audit" },
  { id: "A3", at: daysAgo(3), actorId: "u_registrar", targetId: "u_clerk_1", action: "Granted Temporary Access", module: "Finance", before: {}, after: { permission: "finance.view", expires: "12 days" }, reason: "ledger help" },
  { id: "A4", at: daysAgo(7), actorId: "u_hoi", targetId: "u_fac_anjali", action: "Assigned Access Pack", module: "RBAC", before: {}, after: { pack: "Faculty Core" }, reason: "onboarding" },
  { id: "A5", at: daysAgo(10), actorId: "u_hoi", targetId: undefined, action: "Created Access Pack", module: "RBAC", before: {}, after: { pack: "HOD Core" } },
];

export const INSTITUTION = {
  name: "Bharat Institute of Engineering & Management",
  short: "BIEM",
  city: "Pune",
  type: "Affiliated Engineering College",
  founded: 2008,
  students: 140,
  faculty: 26,
  facultySanctioned: 30,
  departments: 6,
  accreditation: "NAAC Accredited · MBGL Level 3 · valid till Mar 2028",
  naacTarget: "Targeting Level 4",
};
