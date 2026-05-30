import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/common/Avatar";
import { UserStateBadges, StatusChip } from "@/components/common/StateBadges";
import { useUsersStore, useAccessStore } from "@/stores";
import { ROLE_LABEL } from "@/lib/types";
import { ACTION_BY_KEY, MODULES } from "@/lib/permissions";
import { EditAccessDrawer } from "@/components/access/EditAccessDrawer";
import { ArrowLeft, Pencil, History, RotateCcw, Trash2, Send } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/access-control/users/$id")({
  head: () => ({ meta: [{ title: "User Detail — LearnNowX" }] }),
  component: UserDetailPage,
});

function UserDetailPage() {
  const { id } = Route.useParams();
  const user = useUsersStore(s => s.users.find(u => u.id === id));
  const updateUser = useUsersStore(s => s.updateUser);
  const packs = useAccessStore(s => s.packs);
  const audit = useAccessStore(s => s.audit).filter(a => a.targetId === id);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  if (!user) {
    return <div className="p-10 text-center text-muted-foreground">User not found. <Link to="/admin/access-control/people" className="text-lnx-teal-500">Back</Link></div>;
  }
  const pack = packs.find(p => p.id === user.packId);

  const resetToDefault = () => {
    updateUser(user.id, { overrides: [], editedByAdmin: false, restoredToDefault: true, hasSensitiveAccess: false });
    toast.success("Restored to default", { description: `${user.firstName} now uses ${pack?.name ?? "their assigned pack"} unmodified` });
  };

  return (
    <div>
      <Button variant="ghost" size="sm" asChild className="mb-3"><Link to="/admin/access-control/people"><ArrowLeft className="mr-1 h-4 w-4" />All people</Link></Button>

      <Card className="mb-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar initials={user.initials} color={user.avatarColor} size="xl" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-lnx-navy-800">{user.firstName} {user.lastName}</h1>
                <StatusChip status={user.status} />
                <UserStateBadges user={user} />
              </div>
              <p className="text-sm text-muted-foreground">{user.designation} · {ROLE_LABEL[user.role]}{user.department ? ` · ${user.department}` : ""}</p>
              <p className="text-xs text-muted-foreground mt-1">{user.email} · {user.phone}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetToDefault}><RotateCcw className="mr-1 h-4 w-4" />Reset to Default</Button>
            <Button onClick={() => setEditing(true)}><Pencil className="mr-1 h-4 w-4" />Edit Access</Button>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="access">
        <TabsList>
          <TabsTrigger value="access">Access</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="access" className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-lnx-navy-800">Assigned Pack</h3>
            {pack ? (
              <div className="rounded-lg border bg-accent/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-lnx-navy-800">{pack.name}</div>
                    <div className="text-xs text-muted-foreground">{pack.persona} · {pack.permissions.length} permissions</div>
                  </div>
                  {pack.isSystem && <Badge variant="secondary">System Pack</Badge>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{pack.description}</p>
              </div>
            ) : <EmptyState title="No pack assigned" body="This user has no base permissions — assign a pack to enable access." />}
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-lnx-navy-800">Scope</h3>
            <div className="text-sm">
              <Badge variant="outline" className="capitalize">{user.scope.level}</Badge>
              {user.scope.ids.length > 0 && <span className="ml-2 text-muted-foreground">{user.scope.ids.join(", ")}</span>}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-lnx-navy-800">Overrides ({user.overrides.length})</h3>
            {user.overrides.length === 0 ? <p className="text-xs text-muted-foreground">No overrides — uses pack defaults.</p> : (
              <div className="divide-y">
                {user.overrides.map((o, i) => (
                  <div key={i} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <span className={o.mode === "add" ? "text-lnx-green-500" : "text-lnx-red-500"}>{o.mode === "add" ? "+" : "−"}</span>
                      <span className="ml-2 font-medium">{ACTION_BY_KEY[o.permission]?.label ?? o.permission}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{o.reason}</span>
                    </div>
                    {o.expiresAt && <Badge variant="outline" className="text-[10px]">expires {new Date(o.expiresAt).toLocaleDateString()}</Badge>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card className="p-5 text-sm">
            <dl className="grid grid-cols-2 gap-y-3">
              <dt className="text-muted-foreground">Employee ID</dt><dd>{user.employeeId ?? "—"}</dd>
              <dt className="text-muted-foreground">Login Method</dt><dd className="uppercase">{user.loginMethod}</dd>
              <dt className="text-muted-foreground">Department</dt><dd>{user.department ?? "—"}</dd>
              <dt className="text-muted-foreground">Created</dt><dd>{new Date(user.createdAt).toLocaleDateString()}</dd>
              <dt className="text-muted-foreground">Last Updated</dt><dd>{new Date(user.updatedAt).toLocaleDateString()}</dd>
            </dl>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-lnx-navy-800"><History className="inline h-4 w-4 mr-1" />Access Change Log</h3>
            {audit.length === 0 ? <EmptyState title="No access changes recorded" /> : (
              <div className="divide-y">
                {audit.map(a => (
                  <div key={a.id} className="py-2 text-sm">
                    <div><span className="font-medium">{a.action}</span> · <span className="text-xs text-muted-foreground">{a.module}</span></div>
                    <div className="text-xs text-muted-foreground">{new Date(a.at).toLocaleString()} · {a.reason ?? "—"}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-lnx-navy-800">Effective Permissions</h3>
            <div className="space-y-3 text-xs">
              {MODULES.map(m => {
                const allowed = m.actions.filter(a => pack?.permissions.includes(a.key) || user.overrides.some(o => o.permission === a.key && o.mode === "add"));
                if (!allowed.length) return null;
                return (
                  <div key={m.key}>
                    <div className="font-semibold text-lnx-navy-800">{m.label}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {allowed.map(a => <Badge key={a.key} variant="secondary" className="text-[10px]">{a.label}</Badge>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="p-5 border-destructive/50">
            <h3 className="mb-3 text-sm font-semibold text-destructive">Danger Zone</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><div className="text-sm font-medium">Send password reset</div><div className="text-xs text-muted-foreground">Email a reset link.</div></div>
                <Button variant="outline" size="sm" onClick={() => toast.success("Reset link sent")}><Send className="mr-1 h-3 w-3" />Send</Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-3">
                <div><div className="text-sm font-medium text-destructive">Deactivate user</div><div className="text-xs text-muted-foreground">Revoke all access immediately.</div></div>
                <Button variant="destructive" size="sm" onClick={() => { updateUser(user.id, { status: "inactive" }); toast.success("Deactivated"); navigate({ to: "/admin/access-control/people" }); }}><Trash2 className="mr-1 h-3 w-3" />Deactivate</Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <EditAccessDrawer user={user} open={editing} onOpenChange={setEditing} />
    </div>
  );
}
