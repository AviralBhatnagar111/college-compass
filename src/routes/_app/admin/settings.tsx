import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAccessStore, resetAllData } from "@/stores";
import { useAccess } from "@/lib/access";
import { usePolicyStore } from "@/lib/policies";
import { INSTITUTION } from "@/data/seed";
import { Settings as SettingsIcon, ShieldAlert, RotateCcw, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — LearnNowX" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { policies, set: setPolicy } = usePolicyStore();
  const addAudit = useAccessStore(s => s.addAudit);
  const { user } = useAccess();

  const auditPolicy = (key: keyof typeof policies, before: any, after: any) =>
    addAudit({
      id: `aud_${Date.now().toString(36)}`,
      at: new Date().toISOString(),
      actorId: user?.id ?? "u_hoi",
      module: "Settings",
      action: `Policy changed: ${key}`,
      before: { [key]: before },
      after: { [key]: after },
      reason: "Updated via Admin → Settings → Policies",
    });

  const Hint = ({ to, label }: { to: string; label: string }) => (
    <Link to={to} className="inline-flex items-center gap-1 text-[11px] text-lnx-teal-500 hover:underline">
      <ExternalLink className="h-3 w-3" />{label}
    </Link>
  );

  return (
    <div>
      <PageHeader title="Settings" subtitle="Institution preferences. Policies drive thresholds across modules." />
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="demo">Demo Data</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="p-5 space-y-4">
            <div><Label className="text-xs">Institution Name</Label><Input defaultValue={INSTITUTION.name} /></div>
            <div><Label className="text-xs">Short Name</Label><Input defaultValue={INSTITUTION.short} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">City</Label><Input defaultValue={INSTITUTION.city} /></div>
              <div><Label className="text-xs">Type</Label><Input defaultValue={INSTITUTION.type} /></div>
            </div>
            <Button onClick={() => toast.success("Settings saved")}><SettingsIcon className="mr-1 h-4 w-4" />Save</Button>
          </Card>
        </TabsContent>

        <TabsContent value="policies">
          <div className="space-y-4">
            <Card className="p-5 space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">Minimum attendance for exam eligibility</Label>
                  <Badge variant="secondary">{policies.minAttendancePct}%</Badge>
                </div>
                <Slider value={[policies.minAttendancePct]} min={50} max={90} step={1}
                  onValueChange={([v]) => {
                    const before = policies.minAttendancePct;
                    setPolicy("minAttendancePct", v);
                    auditPolicy("minAttendancePct", before, v);
                  }} />
                <p className="mt-2 text-xs text-muted-foreground">
                  Students below this % auto-flagged as "Detained" in Exam Eligibility.
                  &nbsp;<Hint to="/academic/examinations" label="See Examinations" />
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">Late-fee penalty after (days)</Label>
                  <Badge variant="secondary">{policies.lateFeeAfterDays} days</Badge>
                </div>
                <Slider value={[policies.lateFeeAfterDays]} min={0} max={60} step={1}
                  onValueChange={([v]) => { const b = policies.lateFeeAfterDays; setPolicy("lateFeeAfterDays", v); auditPolicy("lateFeeAfterDays", b, v); }} />
                <p className="mt-2 text-xs text-muted-foreground">
                  Drives Defaulters list cutoff & reminder cadence. &nbsp;<Hint to="/finance/defaulters" label="See Defaulters" />
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">Placement season target</Label>
                  <Badge variant="secondary">{policies.placementTargetPct}%</Badge>
                </div>
                <Slider value={[policies.placementTargetPct]} min={50} max={100} step={1}
                  onValueChange={([v]) => { const b = policies.placementTargetPct; setPolicy("placementTargetPct", v); auditPolicy("placementTargetPct", b, v); }} />
                <p className="mt-2 text-xs text-muted-foreground">
                  Used by TPO season reconciliation gauge. &nbsp;<Hint to="/placement/offers" label="See Offers" />
                </p>
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              {([
                ["lockMarksAfterPublish", "Lock marks after publish", "Edits require HOI approval"],
                ["requireReasonForAccessChange", "Require reason for access change", "Drives audit trail"],
                ["sensitiveDataAudit", "Sensitive data viewer audit", "Logs every read of PII"],
                ["autoExpireTempAccess", "Auto-expire temporary access", "Drops scope at validUntil"],
              ] as const).map(([key, label, hint]) => (
                <div key={key} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{hint}</p>
                  </div>
                  <Switch
                    checked={policies[key] as boolean}
                    onCheckedChange={(v) => {
                      const before = policies[key];
                      setPolicy(key, v as any);
                      auditPolicy(key, before, v);
                      toast.success(`${label} ${v ? "enabled" : "disabled"}`);
                    }}
                  />
                </div>
              ))}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <Card className="p-5 space-y-3">
            {[{ k: "DigiLocker / NAD", s: "Connected" }, { k: "NSP Scholarship Portal", s: "Pending" }, { k: "AICTE Feedback", s: "Connected" }, { k: "Razorpay", s: "Connected" }].map(i => (
              <div key={i.k} className="flex items-center justify-between">
                <span className="text-sm">{i.k}</span>
                <Button variant="outline" size="sm" onClick={() => toast.success(`${i.k}: ${i.s}`)}>{i.s}</Button>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="demo">
          <Card className="p-5 border-destructive/50">
            <h3 className="text-sm font-semibold text-destructive flex items-center"><ShieldAlert className="mr-2 h-4 w-4" />Reset Demo Data</h3>
            <p className="my-3 text-xs text-muted-foreground">Wipes all local state (users, packs, attendance, ledger, requests, policies). You'll be sent to the login screen.</p>
            <Button variant="destructive" onClick={resetAllData}><RotateCcw className="mr-1 h-4 w-4" />Reset all data</Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
