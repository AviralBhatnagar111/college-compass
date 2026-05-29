import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAcademicStore } from "@/stores";
import { FileText, Video, Upload, Link2, FileQuestion } from "lucide-react";

export const Route = createFileRoute("/_app/academic/study-material")({
  head: () => ({ meta: [{ title: "Study Material — LearnNowX" }] }),
  component: StudyMaterialPage,
});

const KINDS = [
  { icon: FileText, label: "PDF Notes", count: 142, tone: "text-lnx-teal-500" },
  { icon: Video, label: "Video Lectures", count: 38, tone: "text-lnx-amber-500" },
  { icon: Link2, label: "External Links", count: 21, tone: "text-lnx-navy-800" },
  { icon: FileQuestion, label: "Question Banks", count: 56, tone: "text-lnx-green-500" },
];

function StudyMaterialPage() {
  const subjects = useAcademicStore(s => s.subjects);
  return (
    <div>
      <PageHeader title="Study Material" subtitle="Notes, slides, recordings and references organised by subject" action={<Button><Upload className="h-4 w-4 mr-2" />Upload</Button>} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {KINDS.map(k => (
          <Card key={k.label} className="p-5">
            <k.icon className={`h-5 w-5 ${k.tone}`} />
            <p className="mt-3 text-2xl font-semibold tabular">{k.count}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </Card>
        ))}
      </div>
      <h3 className="text-sm font-semibold mb-3">By Subject</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((s, i) => (
          <Card key={s.id} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs text-muted-foreground">{s.code}</p>
                <h4 className="mt-1 font-semibold text-lnx-navy-800">{s.name}</h4>
              </div>
              <Badge variant="secondary">Sem {s.semester}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-md bg-accent p-2 text-center"><FileText className="h-3 w-3 mx-auto mb-1 text-lnx-teal-500" /><p className="font-semibold">{8 + i}</p><p className="text-muted-foreground">PDFs</p></div>
              <div className="rounded-md bg-accent p-2 text-center"><Video className="h-3 w-3 mx-auto mb-1 text-lnx-amber-500" /><p className="font-semibold">{2 + i % 4}</p><p className="text-muted-foreground">Videos</p></div>
              <div className="rounded-md bg-accent p-2 text-center"><FileQuestion className="h-3 w-3 mx-auto mb-1 text-lnx-green-500" /><p className="font-semibold">{3 + i % 5}</p><p className="text-muted-foreground">Q-Banks</p></div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">Open Library</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
