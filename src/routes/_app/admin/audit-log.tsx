import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccessStore, useUsersStore } from "@/stores";
import { Search, Download, ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/audit-log")({
  head: () => ({ meta: [{ title: "Audit Log — LearnNowX" }] }),
  component: AuditPage,
});

function formatVal(v: any): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}

function DiffBlock({ before, after }: { before?: any; after?: any }) {
  if (!before && !after) return null;
  const keys = Array.from(new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]));
  return (
    <div className="mt-3 rounded-md border bg-muted/30 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Before → After</p>
      <div className="space-y-1.5">
        {keys.map(k => {
          const b = before?.[k]; const a = after?.[k];
          const changed = formatVal(b) !== formatVal(a);
          return (
            <div key={k} className="grid grid-cols-[80px,1fr,16px,1fr] items-center gap-2 text-xs">
              <span className="font-mono text-muted-foreground">{k}</span>
              <span className={`rounded px-1.5 py-0.5 font-mono ${changed ? "bg-lnx-red-500/10 text-lnx-red-500 line-through" : "text-muted-foreground"}`}>{formatVal(b)}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className={`rounded px-1.5 py-0.5 font-mono ${changed ? "bg-lnx-green-500/10 text-lnx-green-500 font-semibold" : "text-muted-foreground"}`}>{formatVal(a)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AuditPage() {
  const audit = useAccessStore(s => s.audit);
  const users = useUsersStore(s => s.users);
  const [q, setQ] = useState("");
  const [mod, setMod] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = audit.filter(a =>
    (mod === "all" || a.module === mod) &&
    (!q || `${a.action} ${a.reason ?? ""}`.toLowerCase().includes(q.toLowerCase()))
  );
  const mods = Array.from(new Set(audit.map(a => a.module)));

  const handleExport = () => {
    const csv = ["When,Actor,Target,Module,Action,Reason,Before,After"];
    filtered.forEach(a => {
      const actor = users.find(u => u.id === a.actorId);
      const target = users.find(u => u.id === a.targetId);
      csv.push([
        new Date(a.at).toISOString(),
        `"${actor?.firstName ?? ""} ${actor?.lastName ?? ""}"`,
        `"${target ? target.firstName + " " + target.lastName : ""}"`,
        a.module, `"${a.action}"`, `"${a.reason ?? ""}"`,
        `"${JSON.stringify(a.before ?? "")}"`,
        `"${JSON.stringify(a.after ?? "")}"`,
      ].join(","));
    });
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `audit-${new Date().toISOString().slice(0,10)}.csv`; link.click();
    URL.revokeObjectURL(url);
    toast.success("Audit exported", { description: `${filtered.length} entries` });
  };

  return (
    <div>
      <PageHeader
        title="Audit Log"
        subtitle={`${audit.length} entries · click any row to view before/after diff`}
        action={<Button variant="outline" onClick={handleExport}><Download className="mr-1 h-4 w-4" />Export CSV</Button>}
        filters={
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search action or reason…" value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
            </div>
            <Select value={mod} onValueChange={setMod}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modules</SelectItem>
                {mods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />
      <Card className="p-0">
        <div className="divide-y">
          {filtered.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No audit entries match your filters.</div>}
          {filtered.map(a => {
            const actor = users.find(u => u.id === a.actorId);
            const target = users.find(u => u.id === a.targetId);
            const hasDiff = !!(a.before || a.after);
            const isOpen = expanded === a.id;
            return (
              <div key={a.id} className="p-4">
                <button
                  onClick={() => hasDiff && setExpanded(isOpen ? null : a.id)}
                  className="w-full text-left"
                  disabled={!hasDiff}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      {hasDiff ? (isOpen ? <ChevronDown className="h-4 w-4 mt-0.5 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground" />)
                        : <span className="w-4" />}
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-medium text-lnx-navy-800">{a.action}</span>
                          <Badge variant="outline" className="ml-2 text-[10px]">{a.module}</Badge>
                          {hasDiff && <Badge variant="secondary" className="ml-1 text-[10px] bg-lnx-teal-500/10 text-lnx-teal-500">diff</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          by {actor?.firstName ?? "—"} {actor?.lastName ?? ""}
                          {target && <> · on {target.firstName} {target.lastName}</>}
                          {a.reason && <> · {a.reason}</>}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(a.at).toLocaleString("en-IN")}</div>
                  </div>
                </button>
                {hasDiff && isOpen && <DiffBlock before={a.before} after={a.after} />}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
