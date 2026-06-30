import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFinanceStore, useUsersStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { Award, IndianRupee, Plus, CheckCircle2, AlertTriangle } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { verifyScholarshipCascade, disburseScholarshipCascade } from "@/lib/cascade";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/finance/scholarships")({
  head: () => ({ meta: [{ title: "Scholarships — LearnNowX" }] }),
  component: ScholarshipsPage,
});

const INR = (n: number) => "₹" + n.toLocaleString("en-IN");

function ScholarshipsPage() {
  const list = useFinanceStore(s => s.scholarships);
  const usersRaw = useUsersStore(s => s.users);
  const { user } = useAccess();
  const [open, setOpen] = useState<string | null>(null);
  const [verified, setVerified] = useState<Set<string>>(new Set());

  const students = useMemo(() => usersRaw.filter(u => u.role === "student").slice(0, 12), [usersRaw]);
  const scheme = list.find(s => s.id === open);

  const doVerify = (sid: string) => {
    if (!scheme) return;
    verifyScholarshipCascade(sid, scheme.name, user?.id ?? "u_registrar");
    setVerified(prev => new Set(prev).add(sid));
    toast.success("Scholarship verified", { description: "Finance queue updated." });
  };
  const disburseAll = () => {
    if (!scheme) return;
    const n = verified.size || 4;
    disburseScholarshipCascade(n, scheme.amount, user?.id ?? "u_finance_head");
    toast.success("Disbursed", { description: `${n} students · ${INR(n * scheme.amount)}` });
    setOpen(null); setVerified(new Set());
  };

  return (
    <div>
      <PageHeader title="Scholarships" subtitle="Schemes, applicants, verification and disbursal" action={<Button onClick={() => toast.info("Scheme builder opens here")}><Plus className="h-4 w-4 mr-2" />New Scheme</Button>} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(s => {
          const escalations = Math.max(0, s.appliedCount - s.approvedCount - 2);
          return (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><Award className="h-4 w-4 text-lnx-teal-500" /><Badge variant="outline" className="text-[10px]">{s.scheme}</Badge></div>
                  <h3 className="mt-2 font-semibold text-lnx-navy-800">{s.name}</h3>
                  <p className="mt-1 text-lg font-bold tabular text-lnx-teal-500"><IndianRupee className="h-4 w-4 inline" />{s.amount.toLocaleString("en-IN")}</p>
                </div>
                {escalations > 0 && (
                  <Badge variant="secondary" className="bg-lnx-amber-500/10 text-lnx-amber-500"><AlertTriangle className="h-3 w-3 mr-1" />{escalations}</Badge>
                )}
              </div>
              <div className="mt-4 space-y-3">
                <Row label="Applied" v={s.appliedCount} max={s.appliedCount} />
                <Row label="Approved" v={s.approvedCount} max={s.appliedCount} tone="bg-lnx-amber-500" />
                <Row label="Disbursed" v={s.disbursedCount} max={s.appliedCount} tone="bg-lnx-green-500" />
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => setOpen(s.id)}>Manage applicants</Button>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!open} onOpenChange={v => !v && setOpen(null)}>
        <DialogContent className="max-w-2xl">
          {scheme && (
            <>
              <DialogHeader><DialogTitle>{scheme.name} — Applicants</DialogTitle></DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>CGPA</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {students.map(s => (
                      <TableRow key={s.id}>
                        <TableCell><div className="flex items-center gap-2"><Avatar firstName={s.firstName} lastName={s.lastName} color={s.avatarColor} size="sm" /><span className="text-sm">{s.firstName} {s.lastName}</span></div></TableCell>
                        <TableCell>{s.cgpa?.toFixed(2)}</TableCell>
                        <TableCell>{verified.has(s.id) ? <Badge className="bg-lnx-green-500/10 text-lnx-green-500" variant="secondary"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge> : <Badge variant="outline">Pending</Badge>}</TableCell>
                        <TableCell>{!verified.has(s.id) && <Button size="sm" onClick={() => doVerify(s.id)}>Verify</Button>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setOpen(null)}>Close</Button><Button onClick={disburseAll}>Disburse {INR((verified.size || 4) * scheme.amount)}</Button></DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, v, max, tone = "bg-lnx-teal-500" }: { label: string; v: number; max: number; tone?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1"><span className="text-muted-foreground">{label}</span><span className="font-semibold tabular">{v}</span></div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className={`h-full ${tone}`} style={{ width: `${(v/Math.max(1,max))*100}%` }} /></div>
    </div>
  );
}
