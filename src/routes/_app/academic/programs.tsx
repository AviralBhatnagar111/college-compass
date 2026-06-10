import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAcademicStore, useUsersStore, useAccessStore } from "@/stores";
import { Plus, BookOpen, Users, GraduationCap } from "lucide-react";
import { KpiCard } from "@/components/common/KpiCard";
import { useAccess } from "@/lib/access";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/academic/programs")({
  head: () => ({ meta: [{ title: "Programs — LearnNowX" }] }),
  component: ProgramsPage,
});

function ProgramsPage() {
  const programs = useAcademicStore(s => s.programs);
  const departments = useAcademicStore(s => s.departments);
  const sections = useAcademicStore(s => s.sections);
  const subjects = useAcademicStore(s => s.subjects);
  const users = useUsersStore(s => s.users);
  const addProgram = useAcademicStore(s => s.addProgram);
  const addAudit = useAccessStore(s => s.addAudit);
  const { user } = useAccess();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", departmentId: "CSE", durationYears: 4 });

  const selected = programs.find(p => p.id === detail);
  const selDept = selected ? departments.find(d => d.id === selected.departmentId) : null;
  const selSecs = selected ? sections.filter(s => s.programId === selected.id) : [];
  const selSubs = selected ? subjects.filter(s => s.departmentId === selected.departmentId) : [];
  const selStudents = selected ? users.filter(u => u.role === "student" && u.programId === selected.id) : [];

  const handleCreate = () => {
    if (!form.name) return;
    const id = `P_${form.departmentId}_${Date.now().toString(36)}`;
    addProgram({ id, name: form.name, departmentId: form.departmentId, durationYears: form.durationYears });
    addAudit({ id: `aud_${Date.now()}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hoi", module: "Academic", action: `Created Program: ${form.name}` });
    toast.success("Program created", { description: form.name });
    setOpen(false); setForm({ name: "", departmentId: "CSE", durationYears: 4 });
  };

  return (
    <div>
      <PageHeader title="Programs" subtitle="Academic programs across all departments"
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Program</Button>} />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Programs" value={programs.length} icon={GraduationCap} />
        <KpiCard label="Departments" value={departments.length} icon={BookOpen} tone="teal" />
        <KpiCard label="Active Sections" value={sections.length} icon={Users} />
        <KpiCard label="Subjects" value={subjects.length} icon={BookOpen} tone="amber" />
      </div>
      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Program</TableHead><TableHead>Department</TableHead><TableHead>Duration</TableHead><TableHead>Sections</TableHead><TableHead>Subjects</TableHead><TableHead>Students</TableHead><TableHead>Status</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {programs.map(p => {
              const dept = departments.find(d => d.id === p.departmentId);
              const secs = sections.filter(s => s.programId === p.id);
              const subs = subjects.filter(s => s.departmentId === p.departmentId);
              const studentCount = users.filter(u => u.role === "student" && u.programId === p.id).length;
              const isMba = p.id === "P_MBA";
              return (
                <TableRow key={p.id} className="cursor-pointer hover:bg-accent/40" onClick={() => setDetail(p.id)}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{dept?.name ?? "—"}</TableCell>
                  <TableCell>{p.durationYears} years</TableCell>
                  <TableCell>{secs.length}</TableCell>
                  <TableCell>{subs.length}</TableCell>
                  <TableCell>{studentCount}</TableCell>
                  <TableCell>{isMba ? <Badge variant="outline" className="border-lnx-amber-500/30 text-lnx-amber-500">Launching 2026-27</Badge> : <Badge variant="secondary">Active</Badge>}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Program</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Program Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="B.Tech / M.Tech / MBA …" /></div>
            <div><Label>Department</Label>
              <Select value={form.departmentId} onValueChange={v => setForm({ ...form, departmentId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Duration (years)</Label><Input type="number" value={form.durationYears} onChange={e => setForm({ ...form, durationYears: +e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleCreate}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px]">
          <SheetHeader><SheetTitle>{selected?.name}</SheetTitle></SheetHeader>
          {selected && (
            <div className="mt-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Department</p><p className="font-medium">{selDept?.name}</p></div>
                <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Duration</p><p className="font-medium">{selected.durationYears} years</p></div>
                <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Sections</p><p className="font-medium">{selSecs.length}</p></div>
                <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Students</p><p className="font-medium">{selStudents.length}</p></div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Sections</p>
                <div className="space-y-1">{selSecs.map(s => <div key={s.id} className="flex justify-between rounded border p-2 text-xs"><span>{s.name} · {s.batch}</span><span className="text-muted-foreground">{users.filter(u => u.sectionId === s.id && u.role === "student").length} / {s.strength}</span></div>)}{selSecs.length === 0 && <p className="text-xs text-muted-foreground">No sections yet.</p>}</div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Subjects ({selSubs.length})</p>
                <div className="space-y-1 max-h-40 overflow-auto">{selSubs.map(s => <div key={s.id} className="flex justify-between rounded border p-2 text-xs"><span className="font-mono">{s.code}</span><span>{s.name}</span></div>)}</div>
              </div>
              <div className="rounded-md bg-accent p-3 text-xs"><p className="font-medium mb-1">Accreditation</p><p className="text-muted-foreground">AICTE approved · NBA Tier-2 · Intake utilisation {selStudents.length > 0 ? Math.round((selStudents.length / (selSecs.reduce((a,s)=>a+s.strength,0)||1))*100) : 0}%</p></div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
