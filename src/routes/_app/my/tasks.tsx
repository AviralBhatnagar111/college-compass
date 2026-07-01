import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/EmptyState";
import { useTaskStore } from "@/stores/tasks";
import { useAuthStore, useUsersStore, useAccessStore } from "@/stores";
import { Check, Circle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/my/tasks")({
  head: () => ({ meta: [{ title: "My Tasks — LearnNowX" }] }),
  component: TasksPage,
});

function TasksPage() {
  const tasks = useTaskStore(s => s.tasks);
  const close = useTaskStore(s => s.closeTask);
  const me = useAuthStore(s => s.currentUserId) ?? "";
  const users = useUsersStore(s => s.users);
  const addAudit = useAccessStore(s => s.addAudit);
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<"mine" | "created" | "all">("mine");

  const filtered = useMemo(() => {
    let list = tasks;
    if (scope === "mine") list = list.filter(t => t.assigneeId === me);
    if (scope === "created") list = list.filter(t => t.createdBy === me);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(s) || (t.note ?? "").toLowerCase().includes(s));
    }
    return list;
  }, [tasks, scope, q, me]);

  const open = filtered.filter(t => t.status === "open");
  const done = filtered.filter(t => t.status !== "open");

  const markDone = (id: string, title: string) => {
    close(id);
    addAudit({ id: `a_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: me, action: "Task closed", module: "Task Inbox", after: { title } });
    toast.success("Task closed");
  };

  const row = (t: typeof tasks[number]) => {
    const assignee = users.find(u => u.id === t.assigneeId);
    const creator = users.find(u => u.id === t.createdBy);
    return (
      <Card key={t.id} className="p-4">
        <div className="flex items-start gap-3">
          <button onClick={() => t.status === "open" && markDone(t.id, t.title)} className="mt-1" aria-label="Toggle">
            {t.status === "open" ? <Circle className="h-5 w-5 text-muted-foreground" /> : <Check className="h-5 w-5 text-emerald-600" />}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`font-medium ${t.status === "open" ? "text-lnx-navy-800" : "line-through text-muted-foreground"}`}>{t.title}</span>
              <Badge variant="outline" className="text-[10px]">{t.source}</Badge>
              {t.dueAt && <Badge variant="secondary" className="text-[10px]">Due {new Date(t.dueAt).toLocaleDateString()}</Badge>}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Assigned to <b>{assignee ? `${assignee.firstName} ${assignee.lastName}` : t.assigneeName}</b>
              {creator ? ` · by ${creator.firstName} ${creator.lastName}` : ""} · {new Date(t.createdAt).toLocaleString()}
            </div>
            {t.note && <div className="mt-2 text-sm text-muted-foreground">{t.note}</div>}
          </div>
          {t.status === "open" && (
            <Button size="sm" variant="outline" onClick={() => markDone(t.id, t.title)}>Mark done</Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader title="My Tasks" subtitle="Everything assigned to you from dashboards, risk flags, and approvals." />
      <div className="flex flex-wrap gap-2">
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search tasks…" className="max-w-sm" />
        <Tabs value={scope} onValueChange={v => setScope(v as any)}>
          <TabsList>
            <TabsTrigger value="mine">Assigned to me ({tasks.filter(t => t.assigneeId === me).length})</TabsTrigger>
            <TabsTrigger value="created">Created by me ({tasks.filter(t => t.createdBy === me).length})</TabsTrigger>
            <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Open · {open.length}</div>
        {open.length === 0
          ? <Card className="p-0"><EmptyState title="Nothing open. Nice work." /></Card>
          : <div className="space-y-2">{open.map(row)}</div>}
      </div>

      {done.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Completed · {done.length}</div>
          <div className="space-y-2">{done.slice(0, 20).map(row)}</div>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Tasks are created from <Link to="/dashboard" className="underline">Dashboard risk flags</Link> and <Link to="/admin/approvals" className="underline">Approval Center</Link>.
      </div>
    </div>
  );
}
