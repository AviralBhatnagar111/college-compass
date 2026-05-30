import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccessStore, useUsersStore } from "@/stores";
import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/admin/audit-log")({
  head: () => ({ meta: [{ title: "Audit Log — LearnNowX" }] }),
  component: () => {
    const audit = useAccessStore(s => s.audit);
    const users = useUsersStore(s => s.users);
    const [q, setQ] = useState("");
    const [mod, setMod] = useState("all");
    const filtered = audit.filter(a => (mod === "all" || a.module === mod) && (!q || `${a.action} ${a.reason ?? ""}`.toLowerCase().includes(q.toLowerCase())));
    const mods = Array.from(new Set(audit.map(a => a.module)));
    return (
      <div>
        <PageHeader title="Audit Log" subtitle="Institution-wide change history" action={<Button variant="outline"><Download className="mr-1 h-4 w-4" />Export CSV</Button>} filters={
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-60"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search action or reason…" value={q} onChange={e => setQ(e.target.value)} className="pl-9" /></div>
            <Select value={mod} onValueChange={setMod}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All modules</SelectItem>{mods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
          </div>
        } />
        <Card className="p-0">
          <div className="divide-y">{filtered.map(a => {
            const actor = users.find(u => u.id === a.actorId);
            const target = users.find(u => u.id === a.targetId);
            return (
              <div key={a.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div><div className="text-sm"><span className="font-medium text-lnx-navy-800">{a.action}</span> <Badge variant="outline" className="ml-2 text-[10px]">{a.module}</Badge></div><div className="text-xs text-muted-foreground mt-1">by {actor?.firstName} {actor?.lastName}{target && <> on {target.firstName} {target.lastName}</>} · {a.reason ?? "—"}</div></div>
                  <div className="text-xs text-muted-foreground">{new Date(a.at).toLocaleString()}</div>
                </div>
              </div>
            );
          })}</div>
        </Card>
      </div>
    );
  },
});
