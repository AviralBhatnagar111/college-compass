// Edit Access drawer — 6 sections (Pack, Scope, Add Extra, Remove, Sensitive, Reason)
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MODULES, SENSITIVE_GROUPS } from "@/lib/permissions";
import { useAccessStore, useUsersStore, useAuthStore } from "@/stores";
import type { User, Override } from "@/lib/types";
import { toast } from "sonner";
import { Lock, Plus, Minus, ShieldAlert } from "lucide-react";

export function EditAccessDrawer({ user, open, onOpenChange }: { user: User | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const packs = useAccessStore(s => s.packs);
  const updateUser = useUsersStore(s => s.updateUser);
  const addAudit = useAccessStore(s => s.addAudit);
  const actorId = useAuthStore(s => s.currentUserId);

  const [packId, setPackId] = useState(user?.packId ?? "");
  const [scopeLevel, setScopeLevel] = useState(user?.scope.level ?? "institution");
  const [scopeIds, setScopeIds] = useState(user?.scope.ids.join(", ") ?? "");
  const [addPerm, setAddPerm] = useState<string[]>([]);
  const [removePerm, setRemovePerm] = useState<string[]>([]);
  const [sensitive, setSensitive] = useState<string[]>([]);
  const [tempUntil, setTempUntil] = useState("");
  const [reason, setReason] = useState("");

  if (!user) return null;
  const pack = packs.find(p => p.id === (packId || user.packId));

  const handleSave = () => {
    if (!reason.trim()) { toast.error("Reason is required"); return; }
    const newOverrides: Override[] = [
      ...user.overrides.filter(o => !removePerm.includes(o.permission)),
      ...addPerm.map(p => ({ permission: p, mode: "add" as const, reason, grantedBy: actorId ?? "u_hoi", grantedAt: new Date().toISOString(), expiresAt: tempUntil ? new Date(tempUntil).toISOString() : undefined })),
      ...removePerm.map(p => ({ permission: p, mode: "remove" as const, reason, grantedBy: actorId ?? "u_hoi", grantedAt: new Date().toISOString() })),
    ];
    updateUser(user.id, {
      packId, scope: { level: scopeLevel as any, ids: scopeIds.split(",").map(s => s.trim()).filter(Boolean) },
      overrides: newOverrides, editedByAdmin: true, hasSensitiveAccess: sensitive.length > 0 || user.hasSensitiveAccess,
    });
    addAudit({ id: `a_${Date.now()}`, at: new Date().toISOString(), actorId: actorId ?? "u_hoi", targetId: user.id, action: "Edited Access", module: "RBAC", before: { pack: user.packId, scope: user.scope }, after: { pack: packId, scope: scopeLevel }, reason });
    toast.success("Access updated", { description: `${user.firstName} ${user.lastName}` });
    onOpenChange(false);
  };

  const togglePerm = (arr: string[], setter: (v: string[]) => void, perm: string) =>
    setter(arr.includes(perm) ? arr.filter(p => p !== perm) : [...arr, perm]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Access — {user.firstName} {user.lastName}</SheetTitle>
          <SheetDescription>All changes are audited. Reason is mandatory.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* 1. Pack */}
          <section>
            <h4 className="mb-2 text-sm font-semibold text-lnx-navy-800">1. Access Pack</h4>
            <Select value={packId} onValueChange={setPackId}>
              <SelectTrigger><SelectValue placeholder="Choose a pack…" /></SelectTrigger>
              <SelectContent>{packs.filter(p => !p.isArchived).map(p => <SelectItem key={p.id} value={p.id}>{p.name} — {p.persona}</SelectItem>)}</SelectContent>
            </Select>
            {pack && <p className="mt-2 text-xs text-muted-foreground">{pack.description}</p>}
          </section>
          <Separator />

          {/* 2. Scope */}
          <section>
            <h4 className="mb-2 text-sm font-semibold text-lnx-navy-800">2. Scope</h4>
            <div className="grid grid-cols-2 gap-2">
              <Select value={scopeLevel} onValueChange={(v: any) => setScopeLevel(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["institution","campus","department","program","batch","section","subject"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="ids (comma-separated)" value={scopeIds} onChange={e => setScopeIds(e.target.value)} />
            </div>
          </section>
          <Separator />

          {/* 3. Add Extra Permissions */}
          <section>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-lnx-navy-800"><Plus className="h-4 w-4 text-lnx-green-500" />3. Add Extra Permissions</h4>
            <div className="max-h-44 overflow-y-auto rounded-lg border p-2">
              {MODULES.flatMap(m => m.actions).map(a => (
                <label key={a.key} className="flex items-center gap-2 px-1 py-1 text-xs">
                  <Checkbox checked={addPerm.includes(a.key)} onCheckedChange={() => togglePerm(addPerm, setAddPerm, a.key)} />
                  <span>{a.label} <code className="text-[10px] text-muted-foreground">{a.key}</code></span>
                </label>
              )).slice(0, 60)}
            </div>
          </section>
          <Separator />

          {/* 4. Remove Permissions */}
          <section>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-lnx-navy-800"><Minus className="h-4 w-4 text-lnx-red-500" />4. Remove Specific Permissions</h4>
            <div className="rounded-lg border p-3 text-xs">
              {pack?.permissions.slice(0, 15).map(p => (
                <label key={p} className="mr-3 inline-flex items-center gap-1">
                  <Checkbox checked={removePerm.includes(p)} onCheckedChange={() => togglePerm(removePerm, setRemovePerm, p)} />
                  <span>{p}</span>
                </label>
              ))}
            </div>
          </section>
          <Separator />

          {/* 5. Sensitive Access */}
          <section>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-lnx-navy-800"><Lock className="h-4 w-4 text-purple-600" />5. Sensitive Data Groups</h4>
            <div className="grid grid-cols-2 gap-1 rounded-lg border bg-purple-50/50 p-3">
              {SENSITIVE_GROUPS.map(g => (
                <label key={g.key} className="flex items-center gap-2 text-xs">
                  <Checkbox checked={sensitive.includes(g.key)} onCheckedChange={() => togglePerm(sensitive, setSensitive, g.key)} />
                  <span>{g.label}</span>
                </label>
              ))}
            </div>
            {sensitive.length > 0 && (
              <div className="mt-2 flex items-center gap-2 rounded-md bg-amber-50 p-2 text-xs text-amber-800">
                <ShieldAlert className="h-3 w-3" /> Granting sensitive data — extra audit trail will be recorded.
              </div>
            )}
          </section>
          <Separator />

          {/* 6. Reason + temporary */}
          <section>
            <h4 className="mb-2 text-sm font-semibold text-lnx-navy-800">6. Justification</h4>
            <Label className="text-xs">Temporary until (optional)</Label>
            <Input type="date" value={tempUntil} onChange={e => setTempUntil(e.target.value)} className="mb-3" />
            <Label className="text-xs">Reason <Badge variant="destructive" className="ml-1 text-[9px]">required</Badge></Label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. covering for HOD on leave, sem-end audit, compliance review…" rows={3} />
          </section>
        </div>

        <SheetFooter className="mt-6 flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Apply Changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
