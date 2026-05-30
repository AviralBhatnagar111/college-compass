// Pack Detail / Builder — 6 tabs
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar } from "@/components/common/Avatar";
import { useAccessStore, useUsersStore } from "@/stores";
import { MODULES, SENSITIVE_GROUPS } from "@/lib/permissions";
import { ArrowLeft, Save, ShieldCheck, Users, Lock, FileText, Layers, Settings } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/access-control/access-packs/$id")({
  head: () => ({ meta: [{ title: "Pack Builder — LearnNowX" }] }),
  component: PackBuilder,
});

function PackBuilder() {
  const { id } = Route.useParams();
  const pack = useAccessStore(s => s.packs.find(p => p.id === id));
  const updatePack = useAccessStore(s => s.updatePack);
  const users = useUsersStore(s => s.users).filter(u => u.packId === id);
  const [draft, setDraft] = useState(pack);

  if (!pack || !draft) return <div className="p-10 text-center">Pack not found. <Link to="/admin/access-control/access-packs" className="text-lnx-teal-500">Back</Link></div>;

  const togglePerm = (key: string) => setDraft(d => d ? { ...d, permissions: d.permissions.includes(key) ? d.permissions.filter(p => p !== key) : [...d.permissions, key] } : d);
  const toggleSensitive = (key: string) => setDraft(d => d ? { ...d, sensitive: (d.sensitive ?? []).includes(key) ? d.sensitive!.filter(s => s !== key) : [...(d.sensitive ?? []), key] } : d);

  const save = () => { updatePack(id, { ...draft, isEdited: true }); toast.success("Pack saved", { description: `${users.length} users will see the new permissions` }); };

  return (
    <div>
      <Button variant="ghost" size="sm" asChild className="mb-3"><Link to="/admin/access-control/access-packs"><ArrowLeft className="mr-1 h-4 w-4" />All packs</Link></Button>

      <PageHeader
        title={pack.name}
        subtitle={`${pack.persona} · ${pack.permissions.length} permissions across ${pack.modules.length} modules`}
        action={
          <div className="flex items-center gap-2">
            {pack.isSystem && <Badge variant="secondary">SYSTEM</Badge>}
            <Button onClick={save}><Save className="mr-1 h-4 w-4" />Save Changes</Button>
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview"><FileText className="mr-1 h-3 w-3" />Overview</TabsTrigger>
          <TabsTrigger value="permissions"><ShieldCheck className="mr-1 h-3 w-3" />Permissions</TabsTrigger>
          <TabsTrigger value="modules"><Layers className="mr-1 h-3 w-3" />Modules</TabsTrigger>
          <TabsTrigger value="sensitive"><Lock className="mr-1 h-3 w-3" />Sensitive Data</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-1 h-3 w-3" />Assigned Users</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="mr-1 h-3 w-3" />Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="p-5 space-y-4">
            <div><label className="text-xs font-medium text-muted-foreground">Pack Name</label><Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} disabled={pack.isSystem} /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Persona</label><Input value={draft.persona} onChange={e => setDraft({ ...draft, persona: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Description</label><Textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} rows={3} /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Default Scope Level</label>
              <Select value={draft.defaultScopeLevel ?? "institution"} onValueChange={(v: any) => setDraft({ ...draft, defaultScopeLevel: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["institution","campus","department","program","batch","section"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card className="p-5">
            <p className="mb-4 text-xs text-muted-foreground">Tick each action this pack should grant. {draft.permissions.length} selected.</p>
            <div className="space-y-4">
              {MODULES.map(m => (
                <div key={m.key} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-lnx-navy-800">{m.label}</h4>
                    <span className="text-xs text-muted-foreground">{m.actions.filter(a => draft.permissions.includes(a.key)).length}/{m.actions.length}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 md:grid-cols-3">
                    {m.actions.map(a => (
                      <label key={a.key} className="flex items-center gap-2 text-xs">
                        <Checkbox checked={draft.permissions.includes(a.key)} onCheckedChange={() => togglePerm(a.key)} />
                        <span>{a.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="modules">
          <Card className="p-5">
            <p className="mb-3 text-xs text-muted-foreground">Modules this pack can navigate to.</p>
            <div className="flex flex-wrap gap-2">
              {MODULES.map(m => (
                <Badge key={m.key} variant={draft.modules.includes(m.key) ? "default" : "outline"} className="cursor-pointer" onClick={() => setDraft({ ...draft, modules: draft.modules.includes(m.key) ? draft.modules.filter(x => x !== m.key) : [...draft.modules, m.key] })}>{m.label}</Badge>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="sensitive">
          <Card className="p-5">
            <p className="mb-3 text-xs text-muted-foreground">Grants visibility into these sensitive data groups. Each grant is auditable.</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {SENSITIVE_GROUPS.map(g => (
                <label key={g.key} className="flex items-center gap-2 rounded-lg border bg-purple-50/30 p-2 text-xs">
                  <Checkbox checked={(draft.sensitive ?? []).includes(g.key)} onCheckedChange={() => toggleSensitive(g.key)} />
                  <Lock className="h-3 w-3 text-purple-600" /><span>{g.label}</span>
                </label>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="p-0">
            {users.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">No users assigned to this pack.</div> : (
              <div className="divide-y">
                {users.map(u => (
                  <Link key={u.id} to="/admin/access-control/users/$id" params={{ id: u.id }} className="flex items-center gap-3 p-3 hover:bg-accent/40">
                    <Avatar initials={u.initials} color={u.avatarColor} size="sm" />
                    <div className="flex-1"><div className="text-sm font-medium">{u.firstName} {u.lastName}</div><div className="text-xs text-muted-foreground">{u.email}</div></div>
                    <Badge variant="outline" className="text-[10px] capitalize">{u.scope.level}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3"><div><div className="text-sm font-medium">System Pack</div><div className="text-xs text-muted-foreground">System packs cannot be deleted, only edited.</div></div><Badge variant={pack.isSystem ? "default" : "outline"}>{pack.isSystem ? "Yes" : "No"}</Badge></div>
            <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-3"><div><div className="text-sm font-medium text-destructive">Archive Pack</div><div className="text-xs text-muted-foreground">Hides the pack. Existing user assignments remain.</div></div><Button variant="destructive" size="sm" disabled={pack.isSystem}>Archive</Button></div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
