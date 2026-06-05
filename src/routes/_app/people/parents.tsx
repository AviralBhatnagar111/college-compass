import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar } from "@/components/common/Avatar";
import { useUsersStore } from "@/stores";
import { Search, MessageSquare, Mail } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/people/parents")({
  head: () => ({ meta: [{ title: "Parents — LearnNowX" }] }),
  component: ParentsPage,
});

function ParentsPage() {
  const users = useUsersStore(s => s.users);
  const parents = users.filter(u => u.role === "parent");
  const [q, setQ] = useState("");
  const [view, setView] = useState<string | null>(null);
  const filtered = parents.filter(p => !q || `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(q.toLowerCase()));
  const viewing = parents.find(p => p.id === view);
  const child = viewing ? users.find(u => u.id === viewing.childId) : null;

  return (
    <div>
      <PageHeader title="Parents" subtitle={`${parents.length} parent accounts linked`} filters={
        <div className="relative max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} className="pl-9" /></div>
      } />
      <Card className="p-0">
        <table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-2">Parent</th><th>Child</th><th>Section</th><th>Phone</th><th></th></tr></thead>
          <tbody className="divide-y">{filtered.slice(0, 100).map(p => {
            const c = users.find(u => u.id === p.childId);
            return (
              <tr key={p.id} className="hover:bg-accent/40 cursor-pointer" onClick={() => setView(p.id)}>
                <td className="px-4 py-2"><div className="flex items-center gap-2"><Avatar initials={p.initials} color={p.avatarColor} size="sm" /><div><div className="font-medium text-lnx-navy-800">{p.firstName} {p.lastName}</div><div className="text-xs text-muted-foreground">{p.email}</div></div></div></td>
                <td>{c?.firstName} {c?.lastName}</td>
                <td className="text-xs">{c?.sectionId ?? "—"}</td>
                <td className="text-xs">{p.phone}</td>
                <td className="text-right pr-3"><Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setView(p.id); }}>View</Button></td>
              </tr>
            );
          })}</tbody></table>
      </Card>

      <Dialog open={!!view} onOpenChange={(v) => !v && setView(null)}>
        <DialogContent>
          {viewing && (
            <>
              <DialogHeader><DialogTitle>{viewing.firstName} {viewing.lastName}</DialogTitle></DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{viewing.email}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{viewing.phone}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Login</span><Badge variant="outline">{viewing.loginMethod}</Badge></div>
                {child && (
                  <div className="rounded-md border p-3">
                    <p className="text-xs uppercase text-muted-foreground mb-1">Child</p>
                    <Link to="/people/students/$id" params={{ id: child.id }} className="font-medium hover:underline">{child.firstName} {child.lastName}</Link>
                    <p className="text-xs text-muted-foreground">{child.rollNo} · {child.sectionId} · CGPA {child.cgpa?.toFixed(2)} · {child.attendancePct}% att</p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => toast.success("Email opened")}><Mail className="h-3 w-3 mr-1" />Email</Button>
                  <Button size="sm" className="flex-1" onClick={() => toast.success("WhatsApp message queued")}><MessageSquare className="h-3 w-3 mr-1" />WhatsApp</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
