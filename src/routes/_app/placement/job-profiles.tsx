import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePlacementStore, useAccessStore, useUsersStore, useCommStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { Plus, Brain, ListChecks, Bot, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/placement/job-profiles")({
  head: () => ({ meta: [{ title: "Job Profiles — LearnNowX" }] }),
  component: JobProfilesPage,
});

const SKILLS: Record<string, string[]> = {
  JP_SDE: ["DSA", "DBMS", "OOP", "System Design", "Git"],
  JP_DA: ["SQL", "Python", "Statistics", "Excel", "Tableau"],
  JP_EMB: ["C/C++", "Microcontrollers", "RTOS", "Embedded Linux", "Circuits"],
};
const ELIG: Record<string, string> = {
  JP_SDE: "CGPA ≥ 7.0, 0 backlogs, CSE/ECE",
  JP_DA: "CGPA ≥ 6.5, 0 backlogs, any branch",
  JP_EMB: "CGPA ≥ 6.5, 0 backlogs, ECE/ME",
};

function JobProfilesPage() {
  const profilesRaw = usePlacementStore(s => s.jobProfiles);
  const drivesRaw = usePlacementStore(s => s.drives);
  const usersRaw = useUsersStore(s => s.users);
  const addAudit = useAccessStore(s => s.addAudit);
  const addNotification = useCommStore(s => s.addNotification);
  const { user } = useAccess();

  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const students = useMemo(() => usersRaw.filter(u => u.role === "student"), [usersRaw]);
  const profiles = useMemo(
    () => profilesRaw.filter(p => p.name.toLowerCase().includes(q.toLowerCase())),
    [profilesRaw, q],
  );
  const drivesFor = (pid: string) => drivesRaw.filter(d => d.jobProfileId === pid);
  const applicantsFor = (pid: string) => {
    const ids = new Set(drivesFor(pid).flatMap(d => d.appliedIds));
    return students.filter(s => ids.has(s.id));
  };

  const launch = (name: string) => {
    const t = new Date().toISOString();
    const audience = students.slice(0, 40);
    addAudit({ id: `aud_${Date.now().toString(36)}`, at: t, actorId: user?.id ?? "u_tpo_head", module: "Placement", action: `Launched practice: ${name}`, reason: `Notified ${audience.length} students` });
    audience.forEach(s => addNotification({ id: `ntf_${s.id}_${Date.now().toString(36)}`, userId: s.id, type: "todo", title: `New practice track: ${name}`, meta: "MCQ + AI interview available", route: "/placement/ai-assessments", createdAt: t }));
    toast.success("Practice track launched", { description: `${audience.length} students notified` });
  };

  const detail = profilesRaw.find(p => p.id === open);

  return (
    <div>
      <PageHeader title="Job Profiles" subtitle="Curated practice tracks with eligibility, skills and mapped drives" action={<Button onClick={() => toast.info("Profile builder opens here")}><Plus className="h-4 w-4 mr-2" />New Profile</Button>} />

      <div className="mb-4 max-w-md relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search profiles…" className="pl-9" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map(p => {
          const drives = drivesFor(p.id);
          const appCount = applicantsFor(p.id).length;
          return (
            <Card key={p.id} className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setOpen(p.id)}>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-lnx-teal-500/10 text-lnx-teal-500 grid place-items-center"><Brain className="h-5 w-5" /></div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lnx-navy-800">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {(SKILLS[p.id] ?? []).slice(0, 4).map(s => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Stat icon={ListChecks} label="MCQs" value={p.mcqBank} />
                <Stat icon={Bot} label="AI Qs" value={p.aiQuestions} />
                <Stat icon={Brain} label="Applied" value={appCount} />
              </div>
              <div className="mt-3 text-[11px] text-muted-foreground">
                {drives.length} mapped drive{drives.length === 1 ? "" : "s"}
              </div>
            </Card>
          );
        })}
      </div>

      <Sheet open={!!open} onOpenChange={v => !v && setOpen(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {detail && (
            <>
              <SheetHeader><SheetTitle>{detail.name}</SheetTitle></SheetHeader>
              <Tabs defaultValue="overview" className="mt-4">
                <TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="drives">Mapped drives</TabsTrigger><TabsTrigger value="applicants">Applicants</TabsTrigger></TabsList>
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <Card className="p-4"><h4 className="text-xs font-semibold text-muted-foreground mb-1">Eligibility</h4><p className="text-sm">{ELIG[detail.id] ?? "Open to all eligible students"}</p></Card>
                  <Card className="p-4"><h4 className="text-xs font-semibold text-muted-foreground mb-2">Skills covered</h4><div className="flex flex-wrap gap-1">{(SKILLS[detail.id] ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}</div></Card>
                  <Card className="p-4"><h4 className="text-xs font-semibold text-muted-foreground mb-1">Description</h4><p className="text-sm">{detail.description}</p></Card>
                  <Button className="w-full" onClick={() => launch(detail.name)}>Launch practice track</Button>
                </TabsContent>
                <TabsContent value="drives" className="mt-4 space-y-2">
                  {drivesFor(detail.id).length === 0 && <p className="text-sm text-muted-foreground">No drives mapped yet.</p>}
                  {drivesFor(detail.id).map(d => (
                    <Card key={d.id} className="p-3 flex items-center justify-between">
                      <div><p className="text-sm font-medium">{d.role}</p><p className="text-xs text-muted-foreground">{d.package} · {d.branches.join(", ")}</p></div>
                      <Badge variant="outline">{d.status}</Badge>
                    </Card>
                  ))}
                </TabsContent>
                <TabsContent value="applicants" className="mt-4 space-y-1">
                  {applicantsFor(detail.id).slice(0, 30).map(s => (
                    <div key={s.id} className="flex items-center justify-between border-b py-2 text-sm">
                      <span>{s.firstName} {s.lastName}</span>
                      <span className="text-xs text-muted-foreground">CGPA {s.cgpa?.toFixed(2)} · {s.attendancePct}%</span>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-md bg-accent p-2 text-center">
      <Icon className="h-3 w-3 mx-auto mb-1 text-lnx-navy-800" />
      <p className="text-sm font-semibold tabular">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
