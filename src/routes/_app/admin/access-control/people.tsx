import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar } from "@/components/common/Avatar";
import { UserStateBadges, StatusChip } from "@/components/common/StateBadges";
import { useUsersStore, useAccessStore, useAuthStore } from "@/stores";
import { ROLE_LABEL, type RoleKey } from "@/lib/types";
import { Search, Filter, Pencil, Plus, Download, UserX, UserCheck } from "lucide-react";
import { EditAccessDrawer } from "@/components/access/EditAccessDrawer";
import { AddUserDialog } from "@/components/access/AddUserDialog";
import { toast } from "sonner";
import type { User } from "@/lib/types";


export const Route = createFileRoute("/_app/admin/access-control/people")({
  head: () => ({ meta: [{ title: "People & Access — LearnNowX" }] }),
  component: PeoplePage,
});

function PeoplePage() {
  const users = useUsersStore(s => s.users);
  const updateUser = useUsersStore(s => s.updateUser);
  const addAudit = useAccessStore(s => s.addAudit);
  const actorId = useAuthStore(s => s.currentUserId) ?? "u_hoi";
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string>("all");
  const [state, setState] = useState<string>("all");
  const [editing, setEditing] = useState<User | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());


  const filtered = useMemo(() => users.filter(u => {
    if (role !== "all" && u.role !== role) return false;
    if (state === "edited" && !u.editedByAdmin) return false;
    if (state === "temp" && !u.overrides.some(o => o.expiresAt)) return false;
    if (state === "sensitive" && !u.hasSensitiveAccess) return false;
    if (state === "review" && !u.needsReview) return false;
    if (q && !(`${u.firstName} ${u.lastName} ${u.email} ${u.department ?? ""}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }), [users, q, role, state]);

  const shown = filtered.slice(0, 80);
  const allSelected = shown.length > 0 && shown.every(u => selected.has(u.id));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) shown.forEach(u => next.delete(u.id));
    else shown.forEach(u => next.add(u.id));
    setSelected(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const exportCsv = () => {
    const rows = filtered.map(u => [u.id, u.firstName, u.lastName, u.email, u.phone ?? "", ROLE_LABEL[u.role as RoleKey], u.packId ?? "", u.scope.level, u.scope.ids.join("|"), u.status, u.department ?? "", u.designation ?? ""]);
    const csv = ["id,firstName,lastName,email,phone,role,pack,scopeLevel,scopeIds,status,department,designation", ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `people-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    addAudit({ id: `a_${Date.now()}`, at: new Date().toISOString(), actorId, targetId: "bulk", action: "Exported People CSV", module: "RBAC", reason: `${filtered.length} users` });
    toast.success("CSV exported", { description: `${filtered.length} rows` });
  };

  const bulkStatus = (status: "active" | "inactive") => {
    if (!selected.size) return;
    const ids = Array.from(selected);
    ids.forEach(id => updateUser(id, { status }));
    addAudit({ id: `a_${Date.now()}`, at: new Date().toISOString(), actorId, targetId: "bulk", action: status === "active" ? "Bulk Activated Users" : "Bulk Deactivated Users", module: "RBAC", reason: `${ids.length} users` });
    toast.success(`${ids.length} users ${status === "active" ? "activated" : "deactivated"}`);
    setSelected(new Set());
  };

  return (
    <div>
      <PageHeader
        title="People & Access"
        subtitle={`${filtered.length} of ${users.length} users${selected.size ? ` · ${selected.size} selected` : ""}`}
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link to="/admin/access-control">← Overview</Link></Button>
            <Button variant="outline" onClick={exportCsv}><Download className="mr-1 h-4 w-4" />Export CSV</Button>
            <Button onClick={() => setAddOpen(true)}><Plus className="mr-1 h-4 w-4" />Add User</Button>
          </div>
        }
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name, email, department…" value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
            </div>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-44"><Filter className="mr-2 h-3 w-3" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {Object.entries(ROLE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                <SelectItem value="edited">Edited by Admin</SelectItem>
                <SelectItem value="temp">Temporary Access</SelectItem>
                <SelectItem value="sensitive">Sensitive Access</SelectItem>
                <SelectItem value="review">Needs Review</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {selected.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg border bg-accent/30 px-4 py-2 text-sm">
          <span className="text-lnx-navy-800 font-medium">{selected.size} selected</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => bulkStatus("active")}><UserCheck className="mr-1 h-3 w-3" />Activate</Button>
            <Button size="sm" variant="outline" onClick={() => bulkStatus("inactive")}><UserX className="mr-1 h-3 w-3" />Deactivate</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        </div>
      )}

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="pl-4 py-2 w-8"><Checkbox checked={allSelected} onCheckedChange={toggleAll} /></th>
                <th className="px-4 py-2">User</th>
                <th>Role</th>
                <th>Pack</th>
                <th>Scope</th>
                <th>Status</th>
                <th>State</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shown.map(u => (
                <tr key={u.id} className="hover:bg-accent/40">
                  <td className="pl-4"><Checkbox checked={selected.has(u.id)} onCheckedChange={() => toggleOne(u.id)} /></td>
                  <td className="px-4 py-2">
                    <Link to="/admin/access-control/users/$id" params={{ id: u.id }} className="flex items-center gap-2">
                      <Avatar initials={u.initials} color={u.avatarColor} size="sm" />
                      <div>
                        <div className="font-medium text-lnx-navy-800">{u.firstName} {u.lastName}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </Link>
                  </td>
                  <td>{ROLE_LABEL[u.role as RoleKey]}</td>
                  <td className="text-xs">{u.packId ?? <Badge variant="destructive" className="text-[10px]">none</Badge>}</td>
                  <td className="text-xs"><span className="capitalize">{u.scope.level}</span>{u.scope.ids.length ? ` · ${u.scope.ids.slice(0,2).join(", ")}` : ""}</td>
                  <td><StatusChip status={u.status} /></td>
                  <td><UserStateBadges user={u} compact /></td>
                  <td className="pr-4 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(u)}><Pencil className="h-3 w-3" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 80 && <div className="border-t p-3 text-center text-xs text-muted-foreground">Showing first 80 results — refine filters to see more.</div>}
      </Card>

      <EditAccessDrawer user={editing} open={!!editing} onOpenChange={v => !v && setEditing(null)} />
      <AddUserDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>

  );
}
