import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccessStore, useUsersStore, useAuthStore } from "@/stores";
import { ROLE_LABEL, type RoleKey, type User } from "@/lib/types";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

const COLORS = ["#002F59","#01B6B9","#B45309","#7C3AED","#DC2626","#059669"];

export function AddUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const packs = useAccessStore(s => s.packs).filter(p => !p.isArchived);
  const addUser = useUsersStore(s => s.addUser);
  const addAudit = useAccessStore(s => s.addAudit);
  const actorId = useAuthStore(s => s.currentUserId) ?? "u_hoi";
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<RoleKey>("faculty");
  const [packId, setPackId] = useState<string>("faculty_core");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");

  const reset = () => { setFirstName(""); setLastName(""); setEmail(""); setPhone(""); setRole("faculty"); setPackId("faculty_core"); setDepartment(""); setDesignation(""); };

  const create = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) { toast.error("Name and email are required"); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast.error("Invalid email address"); return; }
    const id = `u_${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const user: User = {
      id, firstName, lastName, email, phone, role,
      designation: designation || ROLE_LABEL[role],
      department: department || undefined,
      packId,
      scope: { level: (role === "hoi" || role === "registrar" || role === "finance_head" || role === "tpo_head" || role === "exam_head") ? "institution" : "department", ids: department ? [department] : [] },
      overrides: [],
      status: "active",
      loginMethod: "password",
      avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
      initials: `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase(),
      createdAt: now,
      updatedAt: now,
      updatedBy: actorId,
    };
    addUser(user);
    addAudit({ id: `a_${Date.now()}`, at: now, actorId, targetId: id, action: "Created User", module: "RBAC", reason: `New ${ROLE_LABEL[role]}: ${firstName} ${lastName}` });
    toast.success("User created", { description: `${firstName} ${lastName} · ${ROLE_LABEL[role]}` });
    reset();
    onOpenChange(false);
    navigate({ to: "/admin/access-control/users/$id", params: { id } });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Creates the user, assigns a pack, and opens their profile. Auditable.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">First Name</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
          <div><Label className="text-xs">Last Name</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} /></div>
          <div className="col-span-2"><Label className="text-xs">Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div className="col-span-2"><Label className="text-xs">Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Optional" /></div>
          <div><Label className="text-xs">Role</Label>
            <Select value={role} onValueChange={(v: RoleKey) => setRole(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(ROLE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Access Pack</Label>
            <Select value={packId} onValueChange={setPackId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{packs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Department</Label><Input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. CSE" /></div>
          <div><Label className="text-xs">Designation</Label><Input value={designation} onChange={e => setDesignation(e.target.value)} placeholder="Optional" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={create}>Create User</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
