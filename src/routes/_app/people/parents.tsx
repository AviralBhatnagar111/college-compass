import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/common/Avatar";
import { useUsersStore } from "@/stores";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_app/people/parents")({
  head: () => ({ meta: [{ title: "Parents — LearnNowX" }] }),
  component: () => {
    const users = useUsersStore(s => s.users);
    const parents = users.filter(u => u.role === "parent");
    const [q, setQ] = useState("");
    const filtered = parents.filter(p => !q || `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(q.toLowerCase()));
    return (
      <div>
        <PageHeader title="Parents" subtitle={`${parents.length} parent accounts linked`} filters={
          <div className="relative max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} className="pl-9" /></div>
        } />
        <Card className="p-0">
          <table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-2">Parent</th><th>Child</th><th>Section</th><th>Phone</th></tr></thead>
            <tbody className="divide-y">{filtered.slice(0, 100).map(p => {
              const child = users.find(u => u.id === p.childId);
              return (
                <tr key={p.id} className="hover:bg-accent/40">
                  <td className="px-4 py-2"><div className="flex items-center gap-2"><Avatar initials={p.initials} color={p.avatarColor} size="sm" /><div><div className="font-medium text-lnx-navy-800">{p.firstName} {p.lastName}</div><div className="text-xs text-muted-foreground">{p.email}</div></div></div></td>
                  <td>{child?.firstName} {child?.lastName}</td>
                  <td className="text-xs">{child?.sectionId ?? "—"}</td>
                  <td className="text-xs">{p.phone}</td>
                </tr>
              );
            })}</tbody></table>
        </Card>
      </div>
    );
  },
});
