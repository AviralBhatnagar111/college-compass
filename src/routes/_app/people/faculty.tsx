import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar } from "@/components/common/Avatar";
import { useUsersStore } from "@/stores";
import { ROLE_LABEL } from "@/lib/types";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_app/people/faculty")({
  head: () => ({ meta: [{ title: "Faculty & Staff — LearnNowX" }] }),
  component: () => {
    const all = useUsersStore(s => s.users).filter(u => ["hod","faculty","lab_faculty","timetable_coord","clerk","registrar","tpo_head","finance_head","exam_head","hoi"].includes(u.role));
    const [q, setQ] = useState("");
    const [dept, setDept] = useState("all");
    const filtered = all.filter(u => (dept === "all" || u.department === dept) && (!q || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q.toLowerCase())));
    return (
      <div>
        <PageHeader title="Faculty & Staff" subtitle={`${filtered.length} of ${all.length} staff`} filters={
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-60"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} className="pl-9" /></div>
            <Select value={dept} onValueChange={setDept}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All depts</SelectItem>{["CSE","ECE","ME","CIVIL","BIOTECH","MBA"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
          </div>
        } />
        <Card className="p-0">
          <table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-2">Name</th><th>Role</th><th>Department</th><th>Email</th></tr></thead>
            <tbody className="divide-y">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-accent/40">
                  <td className="px-4 py-2"><div className="flex items-center gap-2"><Avatar initials={u.initials} color={u.avatarColor} size="sm" /><span className="font-medium text-lnx-navy-800">{u.firstName} {u.lastName}</span></div></td>
                  <td><Badge variant="outline" className="text-[10px]">{ROLE_LABEL[u.role]}</Badge></td>
                  <td>{u.department ?? "—"}</td>
                  <td className="text-xs text-muted-foreground">{u.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  },
});
