import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { Users, Plus, Shield, Calendar, FileText } from "lucide-react";

export const Route = createFileRoute("/_app/admin/committees")({
  head: () => ({ meta: [{ title: "Committees — LearnNowX" }] }),
  component: CommitteesPage,
});

interface Committee { id: string; name: string; chair: string; members: string[]; mandate: string; meetings: number; }

function CommitteesPage() {
  const { user } = useAccess();
  const addAudit = useAccessStore(s => s.addAudit);
  const audit = (a: string, r?: string) => addAudit({ id: `a_${Date.now()}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hoi", module: "Committees", action: a, reason: r });

  const [list, setList] = useState<Committee[]>([
    { id: "C_IQAC", name: "IQAC — Internal Quality Assurance Cell", chair: "Dr. Rajeshwari Krishnan (Director)", members: ["Dr. Aarti Sharma (Coordinator)", "6 HODs", "2 External Members", "Student Rep", "Parent Rep"], mandate: "Drive quality initiatives, NAAC AQAR, SSR", meetings: 4 },
    { id: "C_AR", name: "Anti-Ragging Committee", chair: "Dr. Rajeshwari Krishnan (Director)", members: ["HoD Discipline", "2 Senior Faculty", "Police Liaison", "Parent Member", "Student Rep"], mandate: "Statutory anti-ragging enforcement", meetings: 6 },
    { id: "C_ICC", name: "ICC — Internal Complaints Committee (POSH)", chair: "Dr. Priya Deshmukh (Presiding Officer)", members: ["Adv. Meera Joshi (External)", "2 Faculty Members", "1 Non-teaching Staff"], mandate: "POSH Act 2013 compliance", meetings: 3 },
    { id: "C_GRV", name: "Grievance Redressal Cell", chair: "Dr. Suresh Iyer (Registrar)", members: ["6 HODs", "Student Welfare Officer", "External Ombudsperson"], mandate: "Student/parent/faculty grievance resolution", meetings: 12 },
    { id: "C_EXAM", name: "Examination Committee", chair: "Dr. Anand Joshi (Exam Cell Head)", members: ["6 HODs", "Chief Superintendent", "Question Paper Coordinator"], mandate: "Exam conduct, evaluation, results", meetings: 8 },
    { id: "C_ADM", name: "Admission Committee", chair: "Dr. Rajeshwari Krishnan (Director)", members: ["Registrar", "6 HODs", "Finance Head", "Admissions Officer"], mandate: "Intake, counseling, enrolment", meetings: 5 },
    { id: "C_LIB", name: "Library Advisory Committee", chair: "Dr. Manoj Kulkarni (HOD ECE)", members: ["Chief Librarian", "1 Faculty/Dept", "2 Student Reps"], mandate: "Library resources, subscriptions, automation", meetings: 4 },
    { id: "C_RES", name: "Research & Ethics Committee", chair: "Dr. Aarti Sharma (HOD CSE)", members: ["3 Senior Faculty (PhD)", "External Expert", "Ethics Member"], mandate: "Research approval, ethics, publications", meetings: 6 },
  ]);

  const [openNew, setOpenNew] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [nc, setNc] = useState({ name: "", chair: "", members: "", mandate: "" });
  const submit = () => {
    if (!nc.name || !nc.chair) { toast.error("Name and chair required"); return; }
    setList([...list, { id: `C_${Date.now()}`, name: nc.name, chair: nc.chair, members: nc.members.split(",").map(s=>s.trim()).filter(Boolean), mandate: nc.mandate, meetings: 0 }]);
    audit("Constituted committee", nc.name);
    toast.success("Committee added");
    setOpenNew(false); setNc({ name: "", chair: "", members: "", mandate: "" });
  };

  const sel = list.find(c => c.id === detail);
  const meetingsFor = (id: string) => {
    const seed = id.charCodeAt(2) % 5;
    const topics = ["AQAR Q3 review", "Grievance case follow-up", "Semester audit sign-off", "Statutory report submission", "Policy amendment", "Budget allocation", "Recruitment approval"];
    return Array.from({ length: 3 + seed }).map((_, i) => ({
      date: new Date(Date.now() - (i * 45 + seed * 7) * 86400000).toISOString(),
      agenda: topics[(i + seed) % topics.length],
      decisions: `${1 + ((i + seed) % 3)} action items`,
    }));
  };
  const logMeeting = (c: Committee) => {
    setList(ls => ls.map(x => x.id === c.id ? { ...x, meetings: x.meetings + 1 } : x));
    audit("Logged committee meeting", c.name);
    toast.success("Meeting recorded");
  };

  return (
    <div>
      <PageHeader title="Committees" subtitle="Statutory & functional committees with chair and members"
        action={<Button onClick={()=>setOpenNew(true)}><Plus className="h-4 w-4 mr-2" />Constitute Committee</Button>} />

      <div className="grid md:grid-cols-2 gap-4">
        {list.map(c => (
          <Card key={c.id} className="p-5 cursor-pointer hover:border-lnx-teal-500 transition" onClick={()=>setDetail(c.id)}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-2"><Shield className="h-4 w-4 text-lnx-teal-500 mt-1" /><div><h3 className="font-semibold text-lnx-navy-800">{c.name}</h3><p className="text-xs text-muted-foreground mt-1">{c.mandate}</p></div></div>
              <Badge variant="outline">{c.meetings} meetings</Badge>
            </div>
            <div className="text-sm mb-2"><span className="text-muted-foreground">Chair: </span><span className="font-medium">{c.chair}</span></div>
            <div className="text-xs"><div className="text-muted-foreground mb-1 flex items-center gap-1"><Users className="h-3 w-3" />Members</div>
              <div className="flex flex-wrap gap-1">{c.members.map((m, i) => <Badge key={i} variant="secondary" className="text-[10px]">{m}</Badge>)}</div>
            </div>
          </Card>
        ))}
      </div>

      <Sheet open={!!detail} onOpenChange={v => !v && setDetail(null)}>
        <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          <SheetHeader><SheetTitle>{sel?.name}</SheetTitle></SheetHeader>
          {sel && (
            <div className="mt-4 space-y-4 text-sm">
              <div className="rounded-md bg-accent p-3 text-xs"><p className="font-medium mb-1">Mandate</p><p className="text-muted-foreground">{sel.mandate}</p></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border p-3"><p className="text-xs text-muted-foreground">Chair</p><p className="font-medium text-xs">{sel.chair}</p></div>
                <div className="rounded border p-3"><p className="text-xs text-muted-foreground">Meetings YTD</p><p className="font-bold tabular text-lnx-teal-500">{sel.meetings}</p></div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Members ({sel.members.length})</p>
                <div className="space-y-1">{sel.members.map((m, i) => <div key={i} className="rounded border p-2 text-xs">{m}</div>)}</div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1"><Calendar className="h-3 w-3" />Recent Meetings</p>
                <div className="space-y-1">{meetingsFor(sel.id).map((m, i) => (
                  <div key={i} className="rounded border p-2 text-xs"><div className="flex justify-between"><span className="font-medium">{m.agenda}</span><span className="text-muted-foreground">{new Date(m.date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span></div><p className="text-muted-foreground">{m.decisions}</p></div>
                ))}</div>
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Button size="sm" variant="outline" className="flex-1" onClick={()=>{ audit("Downloaded minutes", sel.name); toast.success("Minutes exported"); }}><FileText className="h-3 w-3 mr-1" />Export minutes</Button>
                <Button size="sm" className="flex-1" onClick={()=>logMeeting(sel)}><Plus className="h-3 w-3 mr-1" />Log meeting</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent><DialogHeader><DialogTitle>Constitute Committee</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Name</Label><Input value={nc.name} onChange={e=>setNc({...nc, name:e.target.value})} /></div>
            <div><Label>Chair</Label><Input value={nc.chair} onChange={e=>setNc({...nc, chair:e.target.value})} /></div>
            <div><Label>Members (comma-separated)</Label><Input value={nc.members} onChange={e=>setNc({...nc, members:e.target.value})} /></div>
            <div><Label>Mandate</Label><Textarea value={nc.mandate} onChange={e=>setNc({...nc, mandate:e.target.value})} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setOpenNew(false)}>Cancel</Button><Button onClick={submit}>Constitute</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
