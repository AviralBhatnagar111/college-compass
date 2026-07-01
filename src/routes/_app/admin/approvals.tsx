import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { useAccessStore, useUsersStore, useAuthStore, useCommStore } from "@/stores";
import { useDashApprovalStore } from "@/stores/dashboardApprovals";
import { Check, X, Inbox, KeyRound, Wallet, Award, ClipboardList } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/approvals")({
  head: () => ({ meta: [{ title: "Approval Center — LearnNowX" }] }),
  component: ApprovalCenter,
});

// Cross-module pending items — feed the top-bar badge and give HOI a single desk.
type Item = {
  id: string;
  kind: "access" | "waiver" | "refund" | "scholarship" | "leave";
  title: string;
  meta: string;
  requestedBy?: string;
  route: string;
  amount?: number;
};

const SEED_CROSS: Item[] = [
  { id: "wv1", kind: "waiver", title: "Late-fee waiver — Kunal S. (CSE-A2)", meta: "₹2,000 · reason: illness", requestedBy: "u_clerk_1", route: "/finance/budget", amount: 2000 },
  { id: "rf1", kind: "refund", title: "Refund — Priya M. (ECE-B1) withdrawal", meta: "₹18,500 · pro-rata Sem 5", requestedBy: "u_finance_head", route: "/finance/ledger", amount: 18500 },
  { id: "sc1", kind: "scholarship", title: "EWS escalation — 2 pending verification", meta: "Documents uploaded 3d ago", requestedBy: "u_clerk_1", route: "/finance/scholarships" },
  { id: "lv1", kind: "leave", title: "Faculty leave — Dr. Anjali (5d)", meta: "Sub arrangement needed", requestedBy: "u_hod_cse", route: "/people/faculty" },
  { id: "lv2", kind: "leave", title: "Faculty leave — Prof. Sandeep (2d)", meta: "Conference travel", requestedBy: "u_hod_ece", route: "/people/faculty" },
];

const KIND_META: Record<Item["kind"], { label: string; Icon: any; tint: string }> = {
  access: { label: "Access", Icon: KeyRound, tint: "bg-purple-100 text-purple-700" },
  waiver: { label: "Waiver", Icon: Wallet, tint: "bg-amber-100 text-amber-700" },
  refund: { label: "Refund", Icon: Wallet, tint: "bg-rose-100 text-rose-700" },
  scholarship: { label: "Scholarship", Icon: Award, tint: "bg-emerald-100 text-emerald-700" },
  leave: { label: "Leave", Icon: ClipboardList, tint: "bg-sky-100 text-sky-700" },
};

function ApprovalCenter() {
  const requests = useAccessStore(s => s.requests);
  const resolveReq = useAccessStore(s => s.resolveRequest);
  const addAudit = useAccessStore(s => s.addAudit);
  const users = useUsersStore(s => s.users);
  const actor = useAuthStore(s => s.currentUserId) ?? "u_hoi";
  const decisions = useDashApprovalStore(s => s.decisions);
  const decide = useDashApprovalStore(s => s.decide);
  const addNotif = useCommStore(s => s.addNotification);

  const [note, setNote] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");

  const accessItems: Item[] = useMemo(
    () => requests.filter(r => r.status === "pending").map(r => ({
      id: r.id, kind: "access", title: r.change,
      meta: r.reason + (r.validUntil ? ` · until ${new Date(r.validUntil).toLocaleDateString()}` : ""),
      requestedBy: r.requestedBy, route: "/admin/access-control/requests",
    })),
    [requests]
  );

  const crossItems: Item[] = useMemo(
    () => SEED_CROSS.filter(i => !decisions[i.id]),
    [decisions]
  );

  const all = useMemo(() => {
    const merged = [...accessItems, ...crossItems];
    if (!q.trim()) return merged;
    const s = q.toLowerCase();
    return merged.filter(i => i.title.toLowerCase().includes(s) || i.meta.toLowerCase().includes(s));
  }, [accessItems, crossItems, q]);

  const decideItem = (item: Item, decision: "approved" | "rejected") => {
    const n = note[item.id] ?? "";
    if (item.kind === "access") {
      resolveReq(item.id, decision, n, actor);
    } else {
      decide({ reqId: item.id, decision, note: n, byUserId: actor, at: new Date().toISOString() });
    }
    addAudit({
      id: `a_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: actor,
      action: `${decision.toUpperCase()} · ${KIND_META[item.kind].label}`,
      module: "Approval Center", after: { title: item.title, note: n },
    });
    addNotif({
      id: `n_${Date.now().toString(36)}`, userId: item.requestedBy ?? actor,
      title: `${item.title} · ${decision}`, meta: n || "No note",
      route: item.route, createdAt: new Date().toISOString(), type: "recent",
    });
    toast.success(`${KIND_META[item.kind].label} ${decision}`);
    setNote(p => ({ ...p, [item.id]: "" }));
  };

  const filter = (kind: Item["kind"] | "all") =>
    (kind === "all" ? all : all.filter(i => i.kind === kind));

  const renderList = (list: Item[]) => {
    if (list.length === 0) return <Card className="p-0"><EmptyState title="Nothing pending here." /></Card>;
    return (
      <div className="space-y-3">
        {list.map(item => {
          const M = KIND_META[item.kind];
          const by = users.find(u => u.id === item.requestedBy);
          return (
            <Card key={item.id} className="p-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className={`grid h-10 w-10 place-items-center rounded-lg ${M.tint}`}><M.Icon className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="uppercase">{M.label}</Badge>
                    <span className="font-medium text-lnx-navy-800">{item.title}</span>
                    {item.amount ? <Badge variant="secondary">₹{item.amount.toLocaleString("en-IN")}</Badge> : null}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{item.meta}</div>
                  {by && <div className="mt-1 text-xs text-muted-foreground">Requested by {by.firstName} {by.lastName}</div>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Textarea
                      value={note[item.id] ?? ""} onChange={e => setNote(p => ({ ...p, [item.id]: e.target.value }))}
                      placeholder="Add a note (optional)" className="min-h-[60px] flex-1 min-w-[240px]"
                    />
                    <div className="flex flex-col gap-2">
                      <Button size="sm" onClick={() => decideItem(item, "approved")}><Check className="mr-1 h-4 w-4" /> Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => decideItem(item, "rejected")}><X className="mr-1 h-4 w-4" /> Reject</Button>
                      <Button asChild size="sm" variant="ghost"><Link to={item.route}>Open source</Link></Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  const count = (k: Item["kind"] | "all") => filter(k).length;

  return (
    <div className="space-y-4">
      <PageHeader title="Approval Center" subtitle="One desk for every pending decision across access, finance, scholarships, and leaves." icon={Inbox} />
      <div className="flex gap-2">
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter approvals…" className="max-w-sm" />
        <Badge variant="secondary" className="self-center">{count("all")} pending</Badge>
      </div>
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({count("all")})</TabsTrigger>
          <TabsTrigger value="access">Access ({count("access")})</TabsTrigger>
          <TabsTrigger value="waiver">Waivers ({count("waiver")})</TabsTrigger>
          <TabsTrigger value="refund">Refunds ({count("refund")})</TabsTrigger>
          <TabsTrigger value="scholarship">Scholarships ({count("scholarship")})</TabsTrigger>
          <TabsTrigger value="leave">Leaves ({count("leave")})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">{renderList(filter("all"))}</TabsContent>
        <TabsContent value="access" className="mt-4">{renderList(filter("access"))}</TabsContent>
        <TabsContent value="waiver" className="mt-4">{renderList(filter("waiver"))}</TabsContent>
        <TabsContent value="refund" className="mt-4">{renderList(filter("refund"))}</TabsContent>
        <TabsContent value="scholarship" className="mt-4">{renderList(filter("scholarship"))}</TabsContent>
        <TabsContent value="leave" className="mt-4">{renderList(filter("leave"))}</TabsContent>
      </Tabs>
    </div>
  );
}
