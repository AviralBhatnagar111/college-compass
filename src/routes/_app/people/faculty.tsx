import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar } from "@/components/common/Avatar";
import { useUsersStore, useAcademicStore, useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { ROLE_LABEL, type RoleKey } from "@/lib/types";
import { Search, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/people/faculty")({
  head: () => ({ meta: [{ title: "Faculty & Staff — LearnNowX" }] }),
  component: FacultyPage,
});

const STAFF_ROLES: RoleKey[] = ["hod","faculty","lab_faculty","timetable_coord","clerk","registrar","tpo_head","finance_head","exam_head","hoi"];
const DEPTS = ["CSE","ECE","ME","CIVIL","BIOTECH","MBA"];

function FacultyPage() {
  const users = useUsersStore(s => s.users);
  const addUser = useUsersStore(s => s.addUser);
  const addAudit = useAccessStore(s => s.addAudit);
  const { user: me } = useAccess();
  const timetable = useAcademicStore(s => s.timetable);
  const subjects = useAcademicStore(s => s.subjects);
  const sections = useAcademicStore(s => s.sections);

  const all = users.filter(u => STAFF_ROLES.includes(u.role));
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [view, setView] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", department: "CSE", role: "faculty" as RoleKey, designation: "Assistant Professor", employeeId: "" });

  const filtered = all.filter(u => (dept === "all" || u.department === dept) && (!q || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q.toLowerCase())));
  const viewing = all.find(u => u.id === view);

  const facultyContext = useMemo(() => {
    if (!viewing) return null;
    const load = timetable.filter(t => t.facultyId === viewing.id);
    const subjMap = new Map(subjects.map(s => [s.id, s]));
    const secMap = new Map(sections.map(s => [s.id, s]));
    const subjectCodes = Array.from(new Set(load.map(l => subjMap.get(l.subjectId!)?.code).filter(Boolean) as string[]));
    const sectionIds = Array.from(new Set(load.map(l => l.sectionId)));
    const totalCredits = subjectCodes.reduce((a, c) => a + (subjects.find(s => s.code === c)?.credits ?? 0), 0);
    const weekly = load.length;
    const loadPct = Math.min(100, Math.round((weekly / 18) * 100));
    return { load, subjectCodes, sectionIds, totalCredits, weekly, loadPct, subjMap, secMap };
  }, [viewing, timetable, subjects, sections]);

  const submitAdd = () => {
    if (!form.firstName || !form.lastName || !form.email) { toast.error("Name and email required"); return; }
    const id = `u_fac_${Date.now().toString(36)}`;
    const initials = (form.firstName[0] + form.lastName[0]).toUpperCase();
    addUser({
      id, firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone,
      role: form.role, department: form.department, designation: form.designation,
      employeeId: form.employeeId || `EMP${Math.floor(1000 + Math.random()*9000)}`,
      packId: form.role === "hod" ? "hod_core" : "faculty_core",
      scope: { level: "department", ids: [form.department] }, overrides: [],
      status: "active", loginMethod: "password", initials, avatarColor: "#0EA5A0",
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), updatedBy: me?.id,
    });
    addAudit({ id: `a_${Date.now()}`, at: new Date().toISOString(), actorId: me?.id ?? "system", targetId: id, action: "user.create", module: "people", after: { role: form.role, department: form.department } });
    toast.success(`${form.firstName} ${form.lastName} added to ${form.department}`);
    setAddOpen(false);
    setForm({ firstName: "", lastName: "", email: "", phone: "", department: "CSE", role: "faculty", designation: "Assistant Professor", employeeId: "" });
  };

  return (
    <div>
      <PageHeader
        title="Faculty & Staff"
        subtitle={`${filtered.length} of ${all.length} staff`}
        action={<Button onClick={() => setAddOpen(true)}><UserPlus className="h-4 w-4 mr-2" />Add Faculty</Button>}
        filters={
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-60"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} className="pl-9" /></div>
            <Select value={dept} onValueChange={setDept}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All depts</SelectItem>{DEPTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
          </div>
        }
      />
      <Card className="p-0">
        <table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-2">Name</th><th>Role</th><th>Department</th><th>Email</th><th></th></tr></thead>
          <tbody className="divide-y">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-accent/40 cursor-pointer" onClick={() => setView(u.id)}>
                <td className="px-4 py-2"><div className="flex items-center gap-2"><Avatar initials={u.initials} color={u.avatarColor} size="sm" /><span className="font-medium text-lnx-navy-800">{u.firstName} {u.lastName}</span></div></td>
                <td><Badge variant="outline" className="text-[10px]">{ROLE_LABEL[u.role]}</Badge></td>
                <td>{u.department ?? "—"}</td>
                <td className="text-xs text-muted-foreground">{u.email}</td>
                <td className="text-right pr-3"><Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setView(u.id); }}>View</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Add Faculty Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Faculty / Staff</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><Label>First name</Label><Input value={form.firstName} onChange={e=>setForm(p=>({...p,firstName:e.target.value}))} /></div>
            <div><Label>Last name</Label><Input value={form.lastName} onChange={e=>setForm(p=>({...p,lastName:e.target.value}))} /></div>
            <div className="col-span-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} /></div>
            <div><Label>Employee ID</Label><Input placeholder="auto" value={form.employeeId} onChange={e=>setForm(p=>({...p,employeeId:e.target.value}))} /></div>
            <div><Label>Role</Label>
              <Select value={form.role} onValueChange={(v)=>setForm(p=>({...p,role:v as RoleKey}))}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(["faculty","lab_faculty","hod","timetable_coord","clerk","exam_head","registrar","tpo_head","finance_head"] as RoleKey[]).map(r => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Department</Label>
              <Select value={form.department} onValueChange={(v)=>setForm(p=>({...p,department:v}))}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DEPTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Designation</Label><Input value={form.designation} onChange={e=>setForm(p=>({...p,designation:e.target.value}))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setAddOpen(false)}>Cancel</Button><Button onClick={submitAdd}><Plus className="h-4 w-4 mr-1" />Create staff record</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Faculty Detail Sheet */}
      <Sheet open={!!view} onOpenChange={(v) => !v && setView(null)}>
        <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
          {viewing && facultyContext && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar initials={viewing.initials} color={viewing.avatarColor} size="lg" />
                  <div>
                    <SheetTitle>{viewing.firstName} {viewing.lastName}</SheetTitle>
                    <p className="text-xs text-muted-foreground">{viewing.designation ?? ROLE_LABEL[viewing.role]} · {viewing.department ?? "—"} · {viewing.employeeId ?? "—"}</p>
                  </div>
                </div>
              </SheetHeader>
              <Tabs defaultValue="profile" className="mt-4">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="assignments">Assignments</TabsTrigger>
                  <TabsTrigger value="workload">Workload</TabsTrigger>
                  <TabsTrigger value="leaves">Leaves</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-3 text-sm">
                  <Card className="p-4 space-y-2">
                    <Row k="Role" v={<Badge variant="outline">{ROLE_LABEL[viewing.role]}</Badge>} />
                    <Row k="Department" v={viewing.department ?? "—"} />
                    <Row k="Employee ID" v={<span className="font-mono text-xs">{viewing.employeeId ?? "—"}</span>} />
                    <Row k="Email" v={viewing.email} />
                    <Row k="Phone" v={viewing.phone ?? "—"} />
                    <Row k="Status" v={<Badge>{viewing.status}</Badge>} />
                    <Row k="Login" v={viewing.loginMethod} />
                  </Card>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline" className="flex-1"><Link to="/people/faculty-appraisal">Appraisal</Link></Button>
                    <Button asChild size="sm" className="flex-1"><Link to="/admin/access-control/users/$id" params={{ id: viewing.id }}>Edit Access</Link></Button>
                  </div>
                </TabsContent>

                <TabsContent value="assignments" className="space-y-3 text-sm">
                  <Card className="p-4">
                    <p className="font-medium mb-2">Subjects taught ({facultyContext.subjectCodes.length})</p>
                    <div className="flex flex-wrap gap-1">{facultyContext.subjectCodes.length ? facultyContext.subjectCodes.map(c => <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>) : <span className="text-xs text-muted-foreground">No teaching load this term</span>}</div>
                  </Card>
                  <Card className="p-4">
                    <p className="font-medium mb-2">Sections ({facultyContext.sectionIds.length})</p>
                    <div className="flex flex-wrap gap-1">{facultyContext.sectionIds.map(sid => <Badge key={sid} variant="outline" className="text-[10px]">{facultyContext.secMap.get(sid)?.name ?? sid}</Badge>)}</div>
                  </Card>
                  <Card className="p-4">
                    <p className="font-medium mb-2">Committees / Roles</p>
                    <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                      {viewing.role === "hod" && <li>Department Head — {viewing.department}</li>}
                      <li>Examination Cell (sub-member)</li>
                      <li>Mentor — 12 students</li>
                    </ul>
                  </Card>
                </TabsContent>

                <TabsContent value="workload" className="space-y-3 text-sm">
                  <Card className="p-4">
                    <div className="flex justify-between mb-1"><span className="text-muted-foreground">Weekly teaching hours</span><span className="font-medium">{facultyContext.weekly} / 18 hrs</span></div>
                    <Progress value={facultyContext.loadPct} />
                    <p className="text-[11px] text-muted-foreground mt-1">{facultyContext.loadPct < 60 ? "Under-utilized" : facultyContext.loadPct > 95 ? "Overloaded" : "Within AICTE norms"}</p>
                  </Card>
                  <Card className="p-4 grid grid-cols-3 gap-3 text-center">
                    <div><p className="text-2xl font-semibold">{facultyContext.totalCredits}</p><p className="text-[11px] text-muted-foreground">Credits</p></div>
                    <div><p className="text-2xl font-semibold">{facultyContext.subjectCodes.length}</p><p className="text-[11px] text-muted-foreground">Subjects</p></div>
                    <div><p className="text-2xl font-semibold">{facultyContext.sectionIds.length}</p><p className="text-[11px] text-muted-foreground">Sections</p></div>
                  </Card>
                </TabsContent>

                <TabsContent value="leaves" className="space-y-3 text-sm">
                  <Card className="p-4 grid grid-cols-3 gap-3 text-center">
                    <div><p className="text-xl font-semibold">12</p><p className="text-[11px] text-muted-foreground">Casual</p></div>
                    <div><p className="text-xl font-semibold">8</p><p className="text-[11px] text-muted-foreground">Medical</p></div>
                    <div><p className="text-xl font-semibold text-lnx-amber-500">2</p><p className="text-[11px] text-muted-foreground">Pending</p></div>
                  </Card>
                  <Card className="p-4">
                    <p className="font-medium mb-2">Recent leaves</p>
                    <ul className="text-xs space-y-2">
                      <li className="flex justify-between"><span>14 May – 16 May</span><Badge variant="outline">Approved</Badge></li>
                      <li className="flex justify-between"><span>02 Apr</span><Badge variant="outline">Approved</Badge></li>
                      <li className="flex justify-between"><span>28 Mar – 29 Mar</span><Badge className="bg-lnx-amber-500/10 text-lnx-amber-500">Pending</Badge></li>
                    </ul>
                    <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => toast.success("Leave request approved")}>Approve pending</Button>
                  </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-3 text-sm">
                  <Card className="p-4">
                    <p className="font-medium mb-2">Student feedback (term)</p>
                    <div className="flex items-baseline gap-2"><span className="text-3xl font-semibold">4.3</span><span className="text-xs text-muted-foreground">/ 5 · 86 responses</span></div>
                    <Progress value={86} className="mt-2" />
                  </Card>
                  <Card className="p-4 space-y-2">
                    <Row k="Result pass %" v="91%" />
                    <Row k="Course-file completion" v="100%" />
                    <Row k="Attendance posted on time" v="98%" />
                    <Row k="Publications (year)" v="3 (1 Scopus)" />
                    <Row k="Appraisal score" v={<Badge className="bg-lnx-green-500/10 text-lnx-green-500">A · 87/100</Badge>} />
                  </Card>
                  <Button size="sm" asChild className="w-full"><Link to="/people/faculty-appraisal">Open full appraisal</Link></Button>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between text-sm"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>;
}
