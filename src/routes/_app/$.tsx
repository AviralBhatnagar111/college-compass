import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/$")({
  component: PlaceholderPage,
});

function PlaceholderPage() {
  const pathname = useRouterState({ select: r => r.location.pathname });
  const title = pathname.split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g, " ") ?? "Page";
  return (
    <div>
      <PageHeader title={title.replace(/^\w/, c => c.toUpperCase())} subtitle="Coming in the next build wave" />
      <Card className="p-0">
        <EmptyState
          icon={Construction}
          title="This module is on the roadmap"
          body="Phase 1 ships the shell, auth, role switcher, role dashboards and the Access Control sub-product. This module will be fully built in the next wave."
          action={<Button asChild><Link to="/dashboard">Back to dashboard</Link></Button>}
        />
      </Card>
    </div>
  );
}
