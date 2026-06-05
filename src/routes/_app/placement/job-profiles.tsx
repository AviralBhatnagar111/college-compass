import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePlacementStore, useAccessStore, useUsersStore, useCommStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { Plus, Brain, ListChecks, Bot } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/placement/job-profiles")({
  head: () => ({ meta: [{ title: "Job Profiles — LearnNowX" }] }),
  component: JobProfilesPage,
});

function JobProfilesPage() {
  const profiles = usePlacementStore(s => s.jobProfiles);
  const addAudit = useAccessStore(s => s.addAudit);
  const addNotification = useCommStore(s => s.addNotification);
  const students = useUsersStore(s => s.users.filter(u => u.role === "student").slice(0, 40));
  const { user } = useAccess();

  const launch = (profileId: string, name: string) => {
    const t = new Date().toISOString();
    addAudit({ id: `aud_${Date.now().toString(36)}`, at: t, actorId: user?.id ?? "u_tpo_head", module: "Placement", action: `Launched practice: ${name}`, reason: `Notified ${students.length} students` });
    students.forEach(s => addNotification({ id: `ntf_${s.id}_${Date.now().toString(36)}`, userId: s.id, type: "todo", title: `New practice track: ${name}`, meta: `MCQ + AI interview available`, route: "/placement/ai-assessments", createdAt: t }));
    toast.success("Practice track launched", { description: `${students.length} students notified` });
    void profileId;
  };

  return (
    <div>
      <PageHeader title="Job Profiles" subtitle="Practice tracks with curated MCQs and AI interview questions" action={<Button><Plus className="h-4 w-4 mr-2" />New Profile</Button>} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map(p => (
          <Card key={p.id} className="p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-lnx-teal-500/10 text-lnx-teal-500 grid place-items-center"><Brain className="h-5 w-5" /></div>
              <div className="flex-1">
                <h3 className="font-semibold text-lnx-navy-800">{p.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-md bg-accent p-3"><ListChecks className="h-3 w-3 mb-1 text-lnx-navy-800" /><p className="text-lg font-semibold tabular">{p.mcqBank}</p><p className="text-xs text-muted-foreground">MCQ Bank</p></div>
              <div className="rounded-md bg-accent p-3"><Bot className="h-3 w-3 mb-1 text-lnx-amber-500" /><p className="text-lg font-semibold tabular">{p.aiQuestions}</p><p className="text-xs text-muted-foreground">AI Qs</p></div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => toast.info("Editor opens here in production")}>Edit</Button>
              <Button size="sm" className="flex-1" onClick={() => launch(p.id, p.name)}>Launch</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
