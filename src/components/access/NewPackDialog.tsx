import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccessStore, useAuthStore } from "@/stores";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import type { AccessPack } from "@/lib/types";

export function NewPackDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const packs = useAccessStore(s => s.packs);
  const addPack = useAccessStore(s => s.addPack);
  const clonePack = useAccessStore(s => s.clonePack);
  const addAudit = useAccessStore(s => s.addAudit);
  const actorId = useAuthStore(s => s.currentUserId) ?? "u_hoi";
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [persona, setPersona] = useState("");
  const [description, setDescription] = useState("");
  const [basedOn, setBasedOn] = useState<string>("blank");

  const reset = () => { setName(""); setPersona(""); setDescription(""); setBasedOn("blank"); };

  const create = () => {
    if (!name.trim() || !persona.trim()) { toast.error("Name and persona are required"); return; }
    let newId: string;
    if (basedOn !== "blank") {
      const id = clonePack(basedOn);
      if (!id) { toast.error("Clone failed"); return; }
      newId = id;
      useAccessStore.getState().updatePack(id, { name, persona, description, isSystem: false });
    } else {
      newId = `pack_${Date.now().toString(36)}`;
      const pack: AccessPack = { id: newId, name, persona, description, modules: [], permissions: [], isSystem: false, assignedCount: 0, sensitive: [], defaultScopeLevel: "department" };
      addPack(pack);
    }
    addAudit({ id: `a_${Date.now()}`, at: new Date().toISOString(), actorId, targetId: newId, action: "Created Access Pack", module: "RBAC", reason: `New pack: ${name}` });
    toast.success("Pack created", { description: "Opening the builder…" });
    reset();
    onOpenChange(false);
    navigate({ to: "/admin/access-control/access-packs/$id", params: { id: newId } });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Access Pack</DialogTitle>
          <DialogDescription>Start from blank or clone an existing pack. Auditable.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label className="text-xs">Pack Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Department Coordinator" /></div>
          <div><Label className="text-xs">Persona / Role Description</Label><Input value={persona} onChange={e => setPersona(e.target.value)} placeholder="e.g. Coordinates department-level academics" /></div>
          <div><Label className="text-xs">Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What responsibilities does this pack cover?" /></div>
          <div>
            <Label className="text-xs">Base template</Label>
            <Select value={basedOn} onValueChange={setBasedOn}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="blank">Blank (no permissions)</SelectItem>
                {packs.filter(p => !p.isArchived).map(p => <SelectItem key={p.id} value={p.id}>Clone: {p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={create}>Create & Open Builder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
