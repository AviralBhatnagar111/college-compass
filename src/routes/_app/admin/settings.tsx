import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { resetAllData } from "@/stores";
import { INSTITUTION } from "@/data/seed";
import { Settings as SettingsIcon, ShieldAlert, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — LearnNowX" }] }),
  component: () => (
    <div>
      <PageHeader title="Settings" subtitle="Institution preferences and demo data controls" />
      <Tabs defaultValue="general"><TabsList><TabsTrigger value="general">General</TabsTrigger><TabsTrigger value="policies">Policies</TabsTrigger><TabsTrigger value="integrations">Integrations</TabsTrigger><TabsTrigger value="demo">Demo Data</TabsTrigger></TabsList>
        <TabsContent value="general">
          <Card className="p-5 space-y-4">
            <div><Label className="text-xs">Institution Name</Label><Input defaultValue={INSTITUTION.name} /></div>
            <div><Label className="text-xs">Short Name</Label><Input defaultValue={INSTITUTION.short} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">City</Label><Input defaultValue={INSTITUTION.city} /></div><div><Label className="text-xs">Type</Label><Input defaultValue={INSTITUTION.type} /></div></div>
            <Button onClick={() => toast.success("Settings saved")}><SettingsIcon className="mr-1 h-4 w-4" />Save</Button>
          </Card>
        </TabsContent>
        <TabsContent value="policies">
          <Card className="p-5 space-y-3">
            {[{ k: "Lock marks after publish", on: true }, { k: "Require reason for access change", on: true }, { k: "Sensitive data viewer audit", on: true }, { k: "Auto-expire temporary access", on: true }].map(p => (
              <div key={p.k} className="flex items-center justify-between border-b pb-3 last:border-0"><span className="text-sm">{p.k}</span><Switch defaultChecked={p.on} /></div>
            ))}
          </Card>
        </TabsContent>
        <TabsContent value="integrations">
          <Card className="p-5 space-y-3">
            {[{ k: "DigiLocker / NAD", s: "Connected" }, { k: "NSP Scholarship Portal", s: "Pending" }, { k: "AICTE Feedback", s: "Connected" }, { k: "Razorpay", s: "Connected" }].map(i => (
              <div key={i.k} className="flex items-center justify-between"><span className="text-sm">{i.k}</span><Button variant="outline" size="sm">{i.s}</Button></div>
            ))}
          </Card>
        </TabsContent>
        <TabsContent value="demo">
          <Card className="p-5 border-destructive/50">
            <h3 className="text-sm font-semibold text-destructive flex items-center"><ShieldAlert className="mr-2 h-4 w-4" />Reset Demo Data</h3>
            <p className="my-3 text-xs text-muted-foreground">Wipes all local state (users, packs, attendance, ledger, requests). You'll be sent to the login screen.</p>
            <Button variant="destructive" onClick={resetAllData}><RotateCcw className="mr-1 h-4 w-4" />Reset all data</Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  ),
});
