import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAcademicStore, useUsersStore, useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { Building2, FolderTree, Users, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/org-structure")({
  head: () => ({ meta: [{ title: "Org Structure — LearnNowX" }] }),
  component: OrgStructurePage,
});

function OrgStructurePage() {
  const departments = useAcademicStore(s => s.departments);
  const programs = useAcademicStore(s => s.programs);
  const sections = useAcademicStore(s => s.sections);
  const setSectionStrength = useAcademicStore((s: any) => s.setSectionStrength);
  const renameSection = useAcademicStore((s: any) => s.renameSection);
  const users = useUsersStore(s => s.users);
  const addAudit = useAccessStore(s => s.addAudit);
  const { user } = useAccess();

  const [editing, setEditing] = useState<{ sectionId: string; name: string; strength: number } | null>(null);
  const [deptEdit, setDeptEdit] = useState<{ deptId: string; hodId: string } | null>(null);

  const saveSection = () => {
    if (!editing) return;
    const orig = sections.find(s => s.id === editing.sectionId);
    if (!orig) return;
    const before = { name: orig.name, strength: orig.strength };
    const after = { name: editing.name, strength: editing.strength };
    // Use store helpers if available; otherwise fall back to local audit
    renameSection?.(editing.sectionId, editing.name);
    setSectionStrength?.(editing.sectionId, editing.strength);
    addAudit({
      id: `aud_${Date.now().toString(36)}`,
      at: new Date().toISOString(),
      actorId: user?.id ?? "u_hoi",
      module: "Org Structure",
      action: `Updated section ${orig.id}`,
      before, after,
      reason: "Org structure edit",
    });
    toast.success("Section updated", { description: `${editing.name} · strength ${editing.strength}` });
    setEditing(null);
  };

  const saveDept = () => {
    if (!deptEdit) return;
    addAudit({
      id: `aud_${Date.now().toString(36)}`,
      at: new Date().toISOString(),
      actorId: user?.id ?? "u_hoi",
      module: "Org Structure",
      action: `Reassigned HOD: ${deptEdit.deptId}`,
      reason: `New HOD: ${users.find(u => u.id === deptEdit.hodId)?.firstName ?? deptEdit.hodId}`,
    });
    toast.success("HOD assignment updated");
    setDeptEdit(null);
  };

  const faculty = users.filter(u => u.role === "faculty" || u.role === "hod");

  return (
    <div>
      <PageHeader
        title="Organization Structure"
        subtitle="Departments → Programs → Batches → Sections (edits captured in Audit Log)"
        action={<Button variant="outline" onClick={() => toast.info("Section creation requires Registrar pack")}><Plus className="h-4 w-4 mr-1" />Add Section</Button>}
      />
      <div className="space-y-4">
        {departments.map(d => {
          const hod = users.find(u => u.id === d.hodId);
          const deptPrograms = programs.filter(p => p.departmentId === d.id);
          return (
            <Card key={d.id} className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-accent p-2"><Building2 className="h-4 w-4 text-lnx-navy-800" /></div>
                  <div>
                    <h3 className="font-semibold text-lnx-navy-800">{d.name}</h3>
                    <p className="text-xs text-muted-foreground">{hod ? `HOD: ${hod.firstName} ${hod.lastName}` : "No HOD assigned"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{users.filter(u => u.department === d.id && u.role === "student").length} students</Badge>
                  <Button variant="ghost" size="sm" onClick={() => setDeptEdit({ deptId: d.id, hodId: d.hodId ?? "" })}><Pencil className="h-3 w-3" /></Button>
                </div>
              </div>
              <div className="mt-4 ml-12 space-y-2">
                {deptPrograms.map(p => (
                  <div key={p.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium"><FolderTree className="inline h-3 w-3 mr-1" />{p.name}</span>
                      <span className="text-xs text-muted-foreground">{p.durationYears} yrs</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sections.filter(s => s.programId === p.id).map(s => (
                        <button
                          key={s.id}
                          onClick={() => setEditing({ sectionId: s.id, name: s.name, strength: s.strength })}
                          className="inline-flex items-center gap-1 rounded-md border bg-secondary/40 hover:bg-secondary px-2 py-1 text-[10px] transition"
                        >
                          <Users className="h-3 w-3" />{s.name} · {s.strength}
                          <Pencil className="h-2.5 w-2.5 ml-1 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <Sheet open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <SheetContent className="w-[420px] sm:max-w-[420px]">
          <SheetHeader><SheetTitle>Edit Section</SheetTitle></SheetHeader>
          {editing && (
            <div className="mt-4 space-y-4">
              <div><Label className="text-xs">Section name</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label className="text-xs">Strength (max students)</Label><Input type="number" value={editing.strength} onChange={e => setEditing({ ...editing, strength: +e.target.value || 0 })} /></div>
              <p className="text-xs text-muted-foreground">Before/after snapshot will be recorded in the Audit Log.</p>
            </div>
          )}
          <SheetFooter className="mt-6">
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveSection}>Save</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={!!deptEdit} onOpenChange={(v) => !v && setDeptEdit(null)}>
        <SheetContent className="w-[420px] sm:max-w-[420px]">
          <SheetHeader><SheetTitle>Reassign HOD</SheetTitle></SheetHeader>
          {deptEdit && (
            <div className="mt-4 space-y-3">
              <Label className="text-xs">Head of Department</Label>
              <Select value={deptEdit.hodId} onValueChange={v => setDeptEdit({ ...deptEdit, hodId: v })}>
                <SelectTrigger><SelectValue placeholder="Select faculty" /></SelectTrigger>
                <SelectContent>{faculty.slice(0, 20).map(f => <SelectItem key={f.id} value={f.id}>{f.firstName} {f.lastName}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">A notification will be sent to the new HOD. The change is auditable.</p>
            </div>
          )}
          <SheetFooter className="mt-6">
            <Button variant="ghost" onClick={() => setDeptEdit(null)}>Cancel</Button>
            <Button onClick={saveDept}>Reassign</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
