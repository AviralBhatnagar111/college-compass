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
import { useAccess } from "@/lib/access";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/academic/subjects")({
  head: () => ({ meta: [{ title: "Subjects — LearnNowX" }] }),
  component: SubjectsPage,
});

function SubjectsPage() {
  const subjects = useAcademicStore(s => s.subjects);
  const departments = useAcademicStore(s => s.departments);
  const users = useUsersStore(s => s.users);
  const addSubject = useAcademicStore(s => s.addSubject);
  const addAudit = useAccessStore(s => s.addAudit);
  const { user } = useAccess();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", name: "", departmentId: "CSE", credits: 3, ltp: "3-0-0", semester: 5 });

  const filtered = subjects.filter(s =>
    s.name.toLowerCase().includes(q.toLowerCase()) || s.code.toLowerCase().includes(q.toLowerCase())
  );
  const selected = subjects.find(s => s.id === detail);
  const selFaculty = selected ? users.filter(u => (u.role === "faculty" || u.role === "lab_faculty") && u.department === selected.departmentId).slice(0,4) : [];

  const handleCreate = () => {
    if (!form.code || !form.name) return;
    const id = `SUB_${form.code.replace(/\s/g,"")}_${Date.now().toString(36)}`;
    addSubject({ id, ...form });
    addAudit({ id: `aud_${Date.now()}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hoi", module: "Academic", action: `Created Subject: ${form.code} ${form.name}` });
    toast.success("Subject created");
    setOpen(false); setForm({ code: "", name: "", departmentId: "CSE", credits: 3, ltp: "3-0-0", semester: 5 });
  };

  return (
    <div>
      <PageHeader title="Subjects" subtitle={`${filtered.length} of ${subjects.length} subjects across ${departments.length} departments`}
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Subject</Button>}
        filters={
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by code or name..." className="pl-9" />
          </div>
        } />
      <Card className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Subject</TableHead><TableHead>Department</TableHead><TableHead>Credits</TableHead><TableHead>L-T-P</TableHead><TableHead>Semester</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.map(s => (
              <TableRow key={s.id} className="cursor-pointer hover:bg-accent/40" onClick={() => setDetail(s.id)}>
                <TableCell className="font-mono text-xs">{s.code}</TableCell>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{departments.find(d => d.id === s.departmentId)?.name ?? s.departmentId}</TableCell>
                <TableCell><Badge variant="secondary">{s.credits}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{s.ltp}</TableCell>
                <TableCell>Sem {s.semester}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Subject</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-2"><div><Label>Code</Label><Input value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="CS401" /></div><div><Label>Department</Label><Select value={form.departmentId} onValueChange={v => setForm({...form, departmentId: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div></div>
            <div><Label>Subject Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div className="grid grid-cols-3 gap-2"><div><Label>Credits</Label><Input type="number" value={form.credits} onChange={e => setForm({...form, credits: +e.target.value})}/></div><div><Label>L-T-P</Label><Input value={form.ltp} onChange={e => setForm({...form, ltp: e.target.value})}/></div><div><Label>Semester</Label><Input type="number" value={form.semester} onChange={e => setForm({...form, semester: +e.target.value})}/></div></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleCreate}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!detail} onOpenChange={v => !v && setDetail(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px]">
          <SheetHeader><SheetTitle>{selected?.code} · {selected?.name}</SheetTitle></SheetHeader>
          {selected && (
            <div className="mt-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Credits</p><p className="font-medium">{selected.credits}</p></div>
                <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">L-T-P</p><p className="font-mono">{selected.ltp}</p></div>
                <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Semester</p><p className="font-medium">Sem {selected.semester}</p></div>
                <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Department</p><p className="font-medium">{departments.find(d=>d.id===selected.departmentId)?.name}</p></div>
              </div>
              <div><p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Faculty assigned</p><div className="space-y-1">{selFaculty.map(f => <div key={f.id} className="rounded border p-2 text-xs">{f.firstName} {f.lastName} · {f.designation}</div>)}{selFaculty.length===0 && <p className="text-xs text-muted-foreground">Unassigned</p>}</div></div>
              <div className="rounded-md bg-accent p-3 text-xs space-y-1">
                <p className="font-medium">Syllabus coverage</p><div className="h-2 rounded bg-background overflow-hidden"><div className="h-full bg-lnx-teal-500" style={{ width: "72%" }} /></div>
                <p className="text-muted-foreground">72% coverage · Last updated: 2 weeks ago</p>
              </div>
              <div className="rounded-md border p-3 text-xs"><p className="font-medium mb-1">CO-PO Mapping</p><p className="text-muted-foreground">5 Course Outcomes mapped to 8 Program Outcomes. Avg attainment: 2.4 / 3.0</p></div>
              <div className="rounded-md border p-3 text-xs"><p className="font-medium mb-1">Question Banks</p><p className="text-muted-foreground">Internal-1: 48 questions · Internal-2: 36 · External: 60</p></div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
