import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/common/Avatar";
import { UserStateBadges, StatusChip } from "@/components/common/StateBadges";
import { useUsersStore, useAccessStore } from "@/stores";
import { ROLE_LABEL } from "@/lib/types";
import { KpiCard } from "@/components/common/KpiCard";
import { Users, Clock, Lock, Wrench, RefreshCw, ListChecks, Plus } from "lucide-react";

export const Route = createFileRoute("/_app/admin/access-control/")({
  head: () => ({ meta: [{ title: "Access Control — LearnNowX" }] }),
  component: AccessOverview,
});

function AccessOverview() {
  const users = useUsersStore(s => s.users);
  const requests = useAccessStore(s => s.requests);
  const audit = useAccessStore(s => s.audit);

  const total = users.length;
  const active = users.filter(u => u.status === "active").length;
  const pending = requests.filter(r => r.status === "pending").length;
  const temp = users.filter(u => u.overrides.some(o => o.expiresAt)).length;
  const sensitive = users.filter(u => u.hasSensitiveAccess).length;
  const edited = users.filter(u => u.editedByAdmin).length;

  return (
    <div>
      <PageHeader
        title="Access Control"
        subtitle="Governance of who can do what, where, and for how long"
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link to="/admin/access-control/access-packs">Access Packs</Link></Button>
            <Button asChild><Link to="/admin/access-control/people"><Plus className="mr-1 h-4 w-4" /> Add User</Link></Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Total Users" value={total} icon={Users} />
        <KpiCard label="Active" value={active} icon={Users} tone="green" />
        <KpiCard label="Pending Requests" value={pending} icon={ListChecks} tone="amber" />
        <KpiCard label="Temporary Access" value={temp} icon={Clock} />
        <KpiCard label="Sensitive Access" value={sensitive} icon={Lock} />
        <KpiCard label="Edited by Admin" value={edited} icon={Wrench} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-lnx-navy-800">Recent Access Changes</h3>
          <div className="divide-y">
            {audit.slice(0, 6).map(a => {
              const target = users.find(u => u.id === a.targetId);
              const actor = users.find(u => u.id === a.actorId);
              return (
                <div key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="text-lnx-navy-800">
                      <span className="font-medium">{a.action}</span>
                      {target && <span className="text-muted-foreground"> · {target.firstName} {target.lastName}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{a.module} · by {actor?.firstName} {actor?.lastName} · {a.reason ?? "—"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-lnx-navy-800">Pending Requests</h3>
            <Link to="/admin/access-control/requests" className="text-xs font-medium text-lnx-teal-500">View all</Link>
          </div>
          <div className="space-y-2">
            {requests.filter(r => r.status === "pending").slice(0, 3).map(r => {
              const u = users.find(x => x.id === r.userId);
              return (
                <div key={r.id} className="rounded-lg border p-3 text-sm">
                  <div className="font-medium text-lnx-navy-800">{u?.firstName} {u?.lastName}</div>
                  <div className="text-xs text-muted-foreground">{r.change} · {r.reason}</div>
                </div>
              );
            })}
            {requests.filter(r => r.status === "pending").length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">No pending requests</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-lnx-navy-800">People & Access</h3>
          <Link to="/admin/access-control/people" className="text-xs font-medium text-lnx-teal-500">View all {total} users</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2">User</th>
                <th>Role</th>
                <th>Pack</th>
                <th>Scope</th>
                <th>Status</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.slice(0, 8).map(u => (
                <tr key={u.id} className="hover:bg-accent/40">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <Avatar initials={u.initials} color={u.avatarColor} size="sm" />
                      <div>
                        <div className="font-medium text-lnx-navy-800">{u.firstName} {u.lastName}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{ROLE_LABEL[u.role]}</td>
                  <td className="text-xs">{u.packId ?? "—"}</td>
                  <td className="text-xs capitalize">{u.scope.level}{u.scope.ids.length ? ` · ${u.scope.ids.join(", ")}` : ""}</td>
                  <td><StatusChip status={u.status} /></td>
                  <td><UserStateBadges user={u} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
