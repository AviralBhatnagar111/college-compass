import { createFileRoute } from "@tanstack/react-router";
import { ComplianceShell } from "@/components/compliance/ComplianceShell";

export const Route = createFileRoute("/_app/compliance/nba")({
  head: () => ({ meta: [{ title: "NBA — LearnNowX" }] }),
  component: () => <ComplianceShell framework="NBA" subtitle="National Board of Accreditation — outcome-based education readiness"
    pillars={["CO-PO Mapping","Curriculum","Faculty","Students","Outcomes","Facilities","Continuous Improvement"]} />,
});
