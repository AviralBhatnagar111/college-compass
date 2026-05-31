import { createFileRoute, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/lib/access";
import { requestAccessCascade } from "@/lib/cascade";
import { ShieldAlert, ArrowLeft, Send } from "lucide-react";
import { ROLE_LABEL } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/access-denied")({
  head: () => ({ meta: [{ title: "Access Denied — LearnNowX" }] }),
  component: AccessDeniedPage,
});

function AccessDeniedPage() {
  const { user } = useAccess();
  const navigate = useNavigate();
  const search = useRouterState({ select: r => r.location.search }) as { from?: string };
  const target = search?.from ?? "this page";

  const handleRequest = () => {
    if (!user) return;
    requestAccessCascade(user.id, target);
    toast.success("Access request sent", { description: "An admin will review your request shortly." });
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto max-w-lg pt-12">
      <Card className="p-8 text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-lnx-amber-500/15 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8 text-lnx-amber-500" />
        </div>
        <h1 className="text-xl font-semibold text-lnx-navy-800">Access denied</h1>
        <p className="text-sm text-muted-foreground mt-2">
          You don't have permission to view this page.
        </p>
        {user && (
          <p className="text-xs text-muted-foreground mt-1">
            Your current role: <span className="font-medium">{ROLE_LABEL[user.role]}</span>
            {user.department && ` · ${user.department}`}
          </p>
        )}
        <div className="mt-6 flex gap-2 justify-center">
          <Button variant="outline" asChild><Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" />Back to dashboard</Link></Button>
          <Button onClick={handleRequest}><Send className="h-4 w-4 mr-1" />Request access</Button>
        </div>
      </Card>
    </div>
  );
}
