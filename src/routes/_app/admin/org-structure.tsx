import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAcademicStore, useUsersStore } from "@/stores";
import { Building2, FolderTree, Users } from "lucide-react";

export const Route = createFileRoute("/_app/admin/org-structure")({
  head: () => ({ meta: [{ title: "Org Structure — LearnNowX" }] }),
  component: () => {
    const departments = useAcademicStore(s => s.departments);
    const programs = useAcademicStore(s => s.programs);
    const sections = useAcademicStore(s => s.sections);
    const users = useUsersStore(s => s.users);
    return (
      <div>
        <PageHeader title="Organization Structure" subtitle="Departments → Programs → Batches → Sections" />
        <div className="space-y-4">
          {departments.map(d => {
            const hod = users.find(u => u.id === d.hodId);
            const deptPrograms = programs.filter(p => p.departmentId === d.id);
            return (
              <Card key={d.id} className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><div className="rounded-md bg-accent p-2"><Building2 className="h-4 w-4 text-lnx-navy-800" /></div><div><h3 className="font-semibold text-lnx-navy-800">{d.name}</h3><p className="text-xs text-muted-foreground">{hod ? `HOD: ${hod.firstName} ${hod.lastName}` : "No HOD assigned"}</p></div></div>
                  <Badge variant="outline">{users.filter(u => u.department === d.id && u.role === "student").length} students</Badge>
                </div>
                <div className="mt-4 ml-12 space-y-2">
                  {deptPrograms.map(p => (
                    <div key={p.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between"><span className="text-sm font-medium"><FolderTree className="inline h-3 w-3 mr-1" />{p.name}</span><span className="text-xs text-muted-foreground">{p.durationYears} yrs</span></div>
                      <div className="mt-2 flex flex-wrap gap-2">{sections.filter(s => s.programId === p.id).map(s => <Badge key={s.id} variant="secondary" className="text-[10px]"><Users className="inline h-3 w-3 mr-1" />{s.name} · {s.strength}</Badge>)}</div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  },
});
