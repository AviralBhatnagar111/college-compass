import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAccessStore, useUsersStore } from "@/stores";
import { Search, History } from "lucide-react";

export const Route = createFileRoute("/_app/admin/access-control/activity")({
  head: () => ({ meta: [{ title: "Access Activity — LearnNowX" }] }),
  component: Activity,
});

function Activity() {
  const audit = useAccessStore(s => s.audit);
  const users = useUsersStore(s => s.users);
  const [q, setQ] = useState("");
  const filtered = audit.filter(a => !q || `${a.action} ${a.module} ${a.reason ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Access Activity Log"
        subtitle={`${filtered.length} of ${audit.length} events`}
        filters={
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by action, module, reason…" value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
          </div>
        }
      />
      <Card className="p-0">
        <div className="divide-y">
          {filtered.map(a => {
            const target = users.find(u => u.id === a.targetId);
            const actor = users.find(u => u.id === a.actorId);
            return (
              <div key={a.id} className="flex items-start gap-3 p-4">
                <div className="rounded-md bg-accent p-2"><History className="h-4 w-4 text-lnx-navy-800" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className="font-medium text-lnx-navy-800">{a.action}</span>
                    {target && <> on <Link to="/admin/access-control/users/$id" params={{ id: target.id }} className="text-lnx-teal-500 hover:underline">{target.firstName} {target.lastName}</Link></>}
                    <Badge variant="outline" className="ml-2 text-[10px]">{a.module}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    by {actor?.firstName} {actor?.lastName} · {new Date(a.at).toLocaleString()} {a.reason && <>· "{a.reason}"</>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
