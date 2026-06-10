import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useUsersStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { KpiCard } from "@/components/common/KpiCard";
import { AlertTriangle, MessageSquare, Mail, IndianRupee, Phone, Bell, FileText, Lock } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { useState } from "react";
import { MultiChannelPreviewDialog, ConfirmDialog } from "@/components/dashboard/ActionQueue";
import { sendFeeReminderCascade, blockExamAccessCascade } from "@/lib/cascade";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/finance/defaulters")({
  head: () => ({ meta: [{ title: "Defaulters — LearnNowX" }] }),
  component: DefaultersPage,
});

const INR = (n: number) => "₹" + n.toLocaleString("en-IN");
const AMOUNTS = [85000, 72000, 68000, 63000, 61000, 58000, 55000, 54000, 51000, 49000, 47000, 42000, 38000, 74489];

function DefaultersPage() {
  const users = useUsersStore(s => s.users);
  const { user } = useAccess();
  const allStudents = users.filter(u => u.role === "student");
  const students = allStudents.slice(-14);
  const rows = students.map((s, i) => ({
    s, outstanding: AMOUNTS[i], daysOverdue: 5 + (i * 17) % 90, lastNudge: i % 3 === 0 ? "3 days ago" : i % 3 === 1 ? "1 week ago" : "Never",
  }));
  const total = rows.reduce((acc, r) => acc + r.outstanding, 0);
  const critical = rows.filter(r => r.daysOverdue > 60).length;
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [defaultChannels, setDefaultChannels] = useState<("sms" | "whatsapp" | "email")[]>(["sms"]);
  const [target, setTarget] = useState<string[]>([]);
  const [blockId, setBlockId] = useState<string | null>(null);
  const blockRow = blockId ? rows.find(r => r.s.id === blockId) : null;

  const openBulk = (channels: ("sms" | "whatsapp" | "email")[]) => {
    if (sel.size === 0) return;
    setTarget(Array.from(sel));
    setDefaultChannels(channels);
    setPreviewOpen(true);
  };
  const openSingle = (id: string) => {
    setTarget([id]); setDefaultChannels(["sms", "whatsapp"]); setPreviewOpen(true);
  };
  const handleSend = (channels: string[]) => {
    target.forEach(id => sendFeeReminderCascade(id, channels, user?.id ?? "u_finance_head"));
    toast.success("Reminders sent", { description: `${target.length} student${target.length !== 1 ? "s" : ""} · ${channels.join(", ")}` });
    setSel(new Set());
  };

  const recipients = target.map(id => {
    const r = rows.find(x => x.s.id === id);
    return { id, name: r ? `${r.s.firstName} ${r.s.lastName}` : id, phone: r?.s.phone, email: r?.s.email };
  });
  const sample = rows.find(r => r.s.id === target[0]);
  const body = sample ? `Dear Parent, fee dues of ${INR(sample.outstanding)} for ${sample.s.firstName} (${sample.s.rollNo}) are overdue by ${sample.daysOverdue} days. Please clear within 5 days to avoid exam block. — Bharat Institute of Engineering` : "Fee reminder";

  return (
    <div>
      <PageHeader title="Defaulters" subtitle={`${rows.length} students · ${INR(total)} outstanding`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" disabled={sel.size===0} onClick={() => openBulk(["email"])}><Mail className="h-4 w-4 mr-2" />Email ({sel.size})</Button>
            <Button disabled={sel.size===0} onClick={() => openBulk(["sms", "whatsapp"])}><MessageSquare className="h-4 w-4 mr-2" />SMS / WhatsApp ({sel.size})</Button>
          </div>
        } />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Outstanding" value={INR(total)} icon={IndianRupee} tone="red" />
        <KpiCard label="Defaulters" value={rows.length} icon={AlertTriangle} tone="amber" />
        <KpiCard label="Critical (>60 days)" value={critical} icon={AlertTriangle} tone="red" />
        <KpiCard label="Avg Dues" value={INR(Math.round(total/rows.length))} icon={IndianRupee} />
      </div>
      <Card className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="w-10"><Checkbox checked={sel.size===rows.length} onCheckedChange={(v)=>setSel(v?new Set(rows.map(r=>r.s.id)):new Set())} /></TableHead>
            <TableHead>Student</TableHead><TableHead>Section</TableHead><TableHead>Parent Contact</TableHead><TableHead>Outstanding</TableHead><TableHead>Days Overdue</TableHead><TableHead>Last Nudge</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.s.id}>
                <TableCell><Checkbox checked={sel.has(r.s.id)} onCheckedChange={(v)=>{const n=new Set(sel); v?n.add(r.s.id):n.delete(r.s.id); setSel(n);}} /></TableCell>
                <TableCell>
                  <Link to="/people/students/$id" params={{ id: r.s.id }} className="flex items-center gap-2 hover:underline">
                    <Avatar firstName={r.s.firstName} lastName={r.s.lastName} color={r.s.avatarColor} size="sm" />
                    <div><p className="font-medium text-sm">{r.s.firstName} {r.s.lastName}</p><p className="text-xs text-muted-foreground">{r.s.rollNo}</p></div>
                  </Link>
                </TableCell>
                <TableCell>{r.s.sectionId}</TableCell>
                <TableCell className="text-xs"><Phone className="h-3 w-3 inline mr-1" />{r.s.phone}</TableCell>
                <TableCell className="tabular font-semibold text-lnx-red-500">{INR(r.outstanding)}</TableCell>
                <TableCell><Badge variant={r.daysOverdue>60?"destructive":r.daysOverdue>30?"secondary":"outline"} className={r.daysOverdue<=30?"bg-lnx-amber-500/10 text-lnx-amber-500":""}>{r.daysOverdue} days</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.lastNudge}</TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openSingle(r.s.id)}><Bell className="h-3 w-3 mr-1" />Remind</Button>
                  <Button asChild variant="ghost" size="sm"><Link to="/finance/ledger"><FileText className="h-3 w-3 mr-1" />Ledger</Link></Button>
                  <Button variant="ghost" size="sm" onClick={() => setBlockId(r.s.id)} className="text-lnx-red-500 hover:text-lnx-red-500"><Lock className="h-3 w-3 mr-1" />Block</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <MultiChannelPreviewDialog
        open={previewOpen} onOpenChange={setPreviewOpen}
        title="Fee reminder preview" subject="Fee dues — Action required"
        body={body} recipients={recipients} defaultChannels={defaultChannels}
        onSend={handleSend}
      />
    </div>
  );
}
