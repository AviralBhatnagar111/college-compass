import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccessStore } from "@/stores";
import { Copy, Archive, Plus, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { NewPackDialog } from "@/components/access/NewPackDialog";


export const Route = createFileRoute("/_app/admin/access-control/access-packs")({
  head: () => ({ meta: [{ title: "Access Packs — LearnNowX" }] }),
  component: PacksPage,
});

function PacksPage() {
  const packs = useAccessStore(s => s.packs);
  const clonePack = useAccessStore(s => s.clonePack);
  const archivePack = useAccessStore(s => s.archivePack);
  const addAudit = useAccessStore(s => s.addAudit);
  const [q, setQ] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  const filtered = packs.filter(p => !p.isArchived && (`${p.name} ${p.persona}`.toLowerCase().includes(q.toLowerCase())));


  return (
    <div>
      <PageHeader
        title="Access Packs"
        subtitle={`${filtered.length} active packs · system + custom`}
        action={<Button><Plus className="mr-1 h-4 w-4" /> New Pack</Button>}
        filters={
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search packs by name or persona…" value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(p => (
          <Card key={p.id} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-accent p-2 text-lnx-navy-800"><ShieldCheck className="h-4 w-4" /></div>
                <div>
                  <h3 className="text-sm font-semibold text-lnx-navy-800">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.persona}</p>
                </div>
              </div>
              {p.isSystem && <Badge variant="secondary" className="text-[10px]">SYSTEM</Badge>}
            </div>
            <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>{p.permissions.length} perms · {p.modules.length} modules</span>
              <Badge variant="outline" className="text-[10px]">{p.assignedCount ?? 0} users</Badge>
            </div>
            <div className="mt-4 flex gap-2">
              <Button asChild size="sm" variant="outline" className="flex-1"><Link to="/admin/access-control/access-packs/$id" params={{ id: p.id }}>Open</Link></Button>
              <Button size="sm" variant="ghost" onClick={() => { const id = clonePack(p.id); if (id) toast.success("Cloned", { description: "Customize the copy" }); }}><Copy className="h-3 w-3" /></Button>
              {!p.isSystem && <Button size="sm" variant="ghost" onClick={() => { archivePack(p.id); toast.success("Archived"); }}><Archive className="h-3 w-3" /></Button>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
