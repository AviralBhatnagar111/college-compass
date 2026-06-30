import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { FileText, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/academic/certificates")({
  head: () => ({ meta: [{ title: "Certificates & Documents — LearnNowX" }] }),
  component: CertificatesPage,
});

interface Cert { id: string; type: string; student: string; rollNo: string; requested: string; status: "pending" | "approved" | "issued"; }

const TYPES = ["Bonafide Certificate", "Transfer Certificate (TC)", "Character Certificate", "Marksheet / Grade Card", "ID Card", "Provisional Degree"];

const SEED: Cert[] = [
  { id: "CT1", type: "Bonafide Certificate", student: "Vikas Chauhan", rollNo: "23BCSE001", requested: "2026-06-26", status: "pending" },
  { id: "CT2", type: "Marksheet / Grade Card", student: "Priya Sharma", rollNo: "23BCSE008", requested: "2026-06-25", status: "approved" },
  { id: "CT3", type: "Character Certificate", student: "Karan Iyer", rollNo: "23BECE004", requested: "2026-06-22", status: "issued" },
  { id: "CT4", type: "Bonafide Certificate", student: "Sneha Patel", rollNo: "23BME015", requested: "2026-06-20", status: "issued" },
];

function CertificatesPage() {
  const [list, setList] = useState(SEED);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ type: TYPES[0], student: "", rollNo: "" });
  const addAudit = useAccessStore(s => s.addAudit);
  const { user } = useAccess();

  const approve = (id: string) => {
    const c = list.find(x => x.id === id); if (!c) return;
    setList(p => p.map(x => x.id === id ? { ...x, status: "approved" } : x));
    addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? "u_registrar", module: "Certificates", action: `Approved ${c.type} for ${c.student}` });
    toast.success("Approved");
  };
  const issue = (id: string) => {
    const c = list.find(x => x.id === id); if (!c) return;
    setList(p => p.map(x => x.id === id ? { ...x, status: "issued" } : x));
    addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? "u_registrar", module: "Certificates", action: `Issued ${c.type} to ${c.student}` });
    toast.success("Issued", { description: "PDF generated and logged" });
  };
  const create = () => {
    if (!draft.student || !draft.rollNo) return toast.error("Student and roll number required");
    const c: Cert = { id: `CT_${Date.now().toString(36)}`, ...draft, requested: new Date().toISOString().slice(0, 10), status: "pending" };
    setList(p => [c, ...p]);
    toast.success("Request raised");
    setOpen(false); setDraft({ type: TYPES[0], student: "", rollNo: "" });
  };

  const pending = list.filter(c => c.status === "pending").length;
  const issued = list.filter(c => c.status === "issued").length;

  return (
    <div>
      <PageHeader title="Certificates & Documents" subtitle="Bonafide, TC, character certificate, grade cards and ID cards" action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New request</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Pending</div><div className="mt-1 text-2xl font-semibold tabular text-lnx-amber-500">{pending}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Approved</div><div className="mt-1 text-2xl font-semibold tabular">{list.filter(c => c.status === "approved").length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Issued</div><div className="mt-1 text-2xl font-semibold tabular text-lnx-teal-500">{issued}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Templates</div><div className="mt-1 text-2xl font-semibold tabular">{TYPES.length}</div></Card>
      </div>

      <Tabs defaultValue="queue">
        <TabsList><TabsTrigger value="queue">Request queue</TabsTrigger><TabsTrigger value="templates">Templates</TabsTrigger></TabsList>
        <TabsContent value="queue" className="mt-4">
          <Card><Table>
            <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Student</TableHead><TableHead>Roll No</TableHead><TableHead>Requested</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>{list.map(c => (
              <TableRow key={c.id}>
                <TableCell>{c.type}</TableCell>
                <TableCell>{c.student}</TableCell>
                <TableCell className="font-mono text-xs">{c.rollNo}</TableCell>
                <TableCell className="text-xs">{c.requested}</TableCell>
                <TableCell><Badge variant={c.status === "pending" ? "secondary" : c.status === "issued" ? "outline" : "outline"} className={c.status === "issued" ? "bg-lnx-green-500/10 text-lnx-green-500" : ""}>{c.status}</Badge></TableCell>
                <TableCell>{c.status === "pending" ? <Button size="sm" onClick={() => approve(c.id)}>Approve</Button> : c.status === "approved" ? <Button size="sm" onClick={() => issue(c.id)}>Issue PDF</Button> : <Button size="sm" variant="ghost" onClick={() => toast.success("PDF downloaded")}><FileText className="h-3 w-3 mr-1" />Re-download</Button>}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table></Card>
        </TabsContent>
        <TabsContent value="templates" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TYPES.map(t => (
              <Card key={t} className="p-4">
                <FileText className="h-5 w-5 text-lnx-teal-500 mb-2" />
                <h3 className="font-semibold text-lnx-navy-800">{t}</h3>
                <p className="text-xs text-muted-foreground mt-1">Template ready · auto-fills from SIS record</p>
                <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => toast.info("Template editor opens here")}>Edit template</Button>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Document Request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Document type</Label>
              <Select value={draft.type} onValueChange={v => setDraft({ ...draft, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Student name</Label><Input value={draft.student} onChange={e => setDraft({ ...draft, student: e.target.value })} /></div>
            <div><Label>Roll number</Label><Input value={draft.rollNo} onChange={e => setDraft({ ...draft, rollNo: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create}>Raise request</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
