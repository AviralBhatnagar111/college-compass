import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar } from "@/components/common/Avatar";
import { useAccessStore, useUsersStore, useAuthStore } from "@/stores";
import { Check, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";

export const Route = createFileRoute("/_app/admin/access-control/requests")({
  head: () => ({ meta: [{ title: "Access Requests — LearnNowX" }] }),
  component: RequestsPage,
});

function RequestsPage() {
  const requests = useAccessStore(s => s.requests);
  const resolve = useAccessStore(s => s.resolveRequest);
  const users = useUsersStore(s => s.users);
  const actor = useAuthStore(s => s.currentUserId) ?? "u_hoi";
  const [comment, setComment] = useState<Record<string, string>>({});

  const handle = (id: string, status: "approved" | "rejected") => {
    resolve(id, status, comment[id] ?? "", actor);
    toast.success(status === "approved" ? "Request approved" : "Request rejected");
  };

  const render = (status: string) => {
    const list = requests.filter(r => r.status === status);
    if (list.length === 0) return <Card className="p-0"><EmptyState title={`No ${status} requests`} /></Card>;
    return (
      <div className="space-y-3">
        {list.map(r => {
          const u = users.find(x => x.id === r.userId);
          const by = users.find(x => x.id === r.requestedBy);
          return (
            <Card key={r.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {u && <Avatar initials={u.initials} color={u.avatarColor} />}
                  <div>
                    <Link to="/admin/access-control/users/$id" params={{ id: r.userId }} className="font-medium text-lnx-navy-800 hover:underline">{u?.firstName} {u?.lastName}</Link>
                    <div className="text-xs text-muted-foreground">Requested by {by?.firstName} {by?.lastName} · {new Date(r.requestedAt).toLocaleDateString()}</div>
                  </div>
                </div>
                {r.validUntil && <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />until {new Date(r.validUntil).toLocaleDateString()}</Badge>}
              </div>
              <div className="mt-3 rounded-lg bg-accent/30 p-3 text-sm">
                <div className="font-medium text-lnx-navy-800">{r.change}</div>
                <div className="text-xs text-muted-foreground mt-1">Reason: {r.reason}</div>
              </div>
              {status === "pending" && (
                <>
                  <Textarea placeholder="Decision note (optional)" rows={2} className="mt-3" value={comment[r.id] ?? ""} onChange={e => setComment(c => ({ ...c, [r.id]: e.target.value }))} />
                  <div className="mt-3 flex gap-2">
                    <Button onClick={() => handle(r.id, "approved")} className="flex-1"><Check className="mr-1 h-4 w-4" />Approve</Button>
                    <Button variant="outline" onClick={() => handle(r.id, "rejected")} className="flex-1"><X className="mr-1 h-4 w-4" />Reject</Button>
                  </div>
                </>
              )}
              {status !== "pending" && r.comment && <p className="mt-2 text-xs text-muted-foreground italic">"{r.comment}"</p>}
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <PageHeader title="Access Requests" subtitle="Review and approve access change requests" />
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({requests.filter(r => r.status === "pending").length})</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">{render("pending")}</TabsContent>
        <TabsContent value="approved">{render("approved")}</TabsContent>
        <TabsContent value="rejected">{render("rejected")}</TabsContent>
      </Tabs>
    </div>
  );
}
