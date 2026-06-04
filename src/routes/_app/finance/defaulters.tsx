import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useUsersStore } from "@/stores";
import { KpiCard } from "@/components/common/KpiCard";
import { AlertTriangle, MessageSquare, Mail, IndianRupee, Phone } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { useState } from "react";

export const Route = createFileRoute("/_app/finance/defaulters")({
  head: () => ({ meta: [{ title: "Defaulters — LearnNowX" }] }),
  component: DefaultersPage,
});

const INR = (n: number) => "₹" + n.toLocaleString("en-IN");

// Fixed amounts summing to ₹8,17,489 (matches ledger outstanding)
const AMOUNTS = [85000, 72000, 68000, 63000, 61000, 58000, 55000, 54000, 51000, 49000, 47000, 42000, 38000, 74489];

function DefaultersPage() {
  const users = useUsersStore(s => s.users);
  // last 14 students = the actual defaulters in ledger
  const allStudents = users.filter(u => u.role === "student");
  const students = allStudents.slice(-14);
  const rows = students.map((s, i) => ({
    s, outstanding: AMOUNTS[i], daysOverdue: 5 + (i * 17) % 90, lastNudge: i % 3 === 0 ? "3 days ago" : i % 3 === 1 ? "1 week ago" : "Never",
  }));
  const total = rows.reduce((acc, r) => acc + r.outstanding, 0);
  const critical = rows.filter(r => r.daysOverdue > 60).length;
  const [sel, setSel] = useState<Set<string>>(new Set());

  return (
    <div>
      <PageHeader title="Defaulters" subtitle={`${rows.length} students with outstanding dues`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" disabled={sel.size===0}><Mail className="h-4 w-4 mr-2" />Email ({sel.size})</Button>
            <Button disabled={sel.size===0}><MessageSquare className="h-4 w-4 mr-2" />SMS ({sel.size})</Button>
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
                <TableCell><div className="flex items-center gap-2"><Avatar firstName={r.s.firstName} lastName={r.s.lastName} color={r.s.avatarColor} size="sm" /><div><p className="font-medium text-sm">{r.s.firstName} {r.s.lastName}</p><p className="text-xs text-muted-foreground">{r.s.rollNo}</p></div></div></TableCell>
                <TableCell>{r.s.sectionId}</TableCell>
                <TableCell className="text-xs"><Phone className="h-3 w-3 inline mr-1" />{r.s.phone}</TableCell>
                <TableCell className="tabular font-semibold text-lnx-red-500">{INR(r.outstanding)}</TableCell>
                <TableCell><Badge variant={r.daysOverdue>60?"destructive":r.daysOverdue>30?"secondary":"outline"} className={r.daysOverdue<=30?"bg-lnx-amber-500/10 text-lnx-amber-500":""}>{r.daysOverdue} days</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.lastNudge}</TableCell>
                <TableCell><Button variant="ghost" size="sm">View Ledger</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
