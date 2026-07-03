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
  const [nc, setNc] = useState({ name: "", chair: "", members: "", mandate: "" });
  const submit = () => {
    if (!nc.name || !nc.chair) { toast.error("Name and chair required"); return; }
    setList([...list, { id: `C_${Date.now()}`, name: nc.name, chair: nc.chair, members: nc.members.split(",").map(s=>s.trim()).filter(Boolean), mandate: nc.mandate, meetings: 0 }]);
    audit("Constituted committee", nc.name);
    toast.success("Committee added");
    setOpenNew(false); setNc({ name: "", chair: "", members: "", mandate: "" });
  };

  return (
    <div>
      <PageHeader title="Committees" subtitle="Statutory & functional committees with chair and members"
        action={<Button onClick={()=>setOpenNew(true)}><Plus className="h-4 w-4 mr-2" />Constitute Committee</Button>} />

      <div className="grid md:grid-cols-2 gap-4">
        {list.map(c => (
          <Card key={c.id} className="p-5">
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
