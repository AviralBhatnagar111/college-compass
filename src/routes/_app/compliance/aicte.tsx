import { createFileRoute } from "@tanstack/react-router";
import { ComplianceShell } from "@/components/compliance/ComplianceShell";

export const Route = createFileRoute("/_app/compliance/aicte")({
  head: () => ({ meta: [{ title: "AICTE — LearnNowX" }] }),
  component: () => <ComplianceShell framework="AICTE" subtitle="All India Council for Technical Education — approval, EOA and mandatory disclosures"
    pillars={["EOA Renewal","Faculty Compliance","Infrastructure","Mandatory Disclosure","Student Strength","Anti-Ragging","Internal Complaints"]} />,
});
