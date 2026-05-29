import { createFileRoute } from "@tanstack/react-router";
import { ComplianceShell } from "@/components/compliance/ComplianceShell";

export const Route = createFileRoute("/_app/compliance/nirf")({
  head: () => ({ meta: [{ title: "NIRF — LearnNowX" }] }),
  component: () => <ComplianceShell framework="NIRF" subtitle="National Institutional Ranking Framework — parameters and submissions"
    pillars={["Teaching, Learning & Resources","Research & Professional Practice","Graduation Outcomes","Outreach & Inclusivity","Perception"]} />,
});
