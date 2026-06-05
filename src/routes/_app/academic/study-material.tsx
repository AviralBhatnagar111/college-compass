import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useAcademicStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { FileText, Video, Upload, Link2, FileQuestion } from "lucide-react";
import { uploadMaterialCascade } from "@/lib/cascade";
import { toast } from "sonner";

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
  const sections = useAcademicStore(s => s.sections);
  const { user } = useAccess();
  const [open, setOpen] = useState(false);
  const [library, setLibrary] = useState<string | null>(null);
  const [form, setForm] = useState({ secId: sections[0]?.id ?? "", subId: subjects[0]?.id ?? "", file: "" });

  const upload = () => {
    if (!form.file.trim()) { toast.error("File name required"); return; }
    const sub = subjects.find(s => s.id === form.subId);
    uploadMaterialCascade(form.secId, sub?.code ?? form.subId, form.file.trim(), user?.id ?? "u_fac_anjali");
    toast.success("Material uploaded", { description: "Section notified." });
    setOpen(false); setForm({ ...form, file: "" });
  };

  const sub = subjects.find(s => s.id === library);

  return (
    <div>
      <PageHeader title="Study Material" subtitle="Notes, slides, recordings and references organised by subject"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Upload className="h-4 w-4 mr-2" />Upload</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Upload study material</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-2">
                <div><Label>Section</Label>
                  <Select value={form.secId} onValueChange={v => setForm({...form, secId: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Subject</Label>
                  <Select value={form.subId} onValueChange={v => setForm({...form, subId: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.code} · {s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>File name</Label><Input value={form.file} onChange={e => setForm({...form, file: e.target.value})} placeholder="lecture-12-normalization.pdf" /></div>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={upload}>Upload &amp; Notify</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        } />
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
            <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => setLibrary(s.id)}>Open Library</Button>
          </Card>
        ))}
      </div>

      <Dialog open={!!library} onOpenChange={(v) => !v && setLibrary(null)}>
        <DialogContent>
          {sub && (
            <>
              <DialogHeader><DialogTitle>{sub.code} · {sub.name}</DialogTitle></DialogHeader>
              <div className="space-y-2">
                {["lecture-01-intro.pdf","lecture-02-er-model.pdf","tutorial-1.pdf","quiz-bank-mid1.pdf","reference-textbook-ch3.pdf"].map((f, i) => (
                  <div key={f} className="flex items-center justify-between rounded-md border p-2 text-sm">
                    <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-lnx-teal-500" /><span>{f}</span></div>
                    <Badge variant="outline" className="text-[10px]">{(120 + i * 87) % 500 + 100} KB</Badge>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
