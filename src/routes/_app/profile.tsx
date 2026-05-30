import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/common/Avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAccess } from "@/lib/access";
import { ROLE_LABEL } from "@/lib/types";
import { Key, Lock, Smartphone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — LearnNowX" }] }),
  component: () => {
    const { user, pack } = useAccess();
    if (!user) return null;
    return (
      <div>
        <PageHeader title="My Profile" subtitle="Personal info, password and 2FA" />
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <Avatar initials={user.initials} color={user.avatarColor} size="xl" />
            <div>
              <h2 className="text-lg font-semibold text-lnx-navy-800">{user.firstName} {user.lastName}</h2>
              <p className="text-sm text-muted-foreground">{ROLE_LABEL[user.role]} · {pack?.name ?? "no pack"}</p>
            </div>
          </div>
        </Card>
        <Tabs defaultValue="info"><TabsList><TabsTrigger value="info">Personal Info</TabsTrigger><TabsTrigger value="security">Security</TabsTrigger><TabsTrigger value="notifications">Notifications</TabsTrigger></TabsList>
          <TabsContent value="info">
            <Card className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3"><div><Label>First Name</Label><Input defaultValue={user.firstName} /></div><div><Label>Last Name</Label><Input defaultValue={user.lastName} /></div></div>
              <div><Label>Email</Label><Input defaultValue={user.email} disabled /></div>
              <div><Label>Phone</Label><Input defaultValue={user.phone} /></div>
              <Button onClick={() => toast.success("Profile saved")}>Save Changes</Button>
            </Card>
          </TabsContent>
          <TabsContent value="security">
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3"><div className="flex items-center gap-2"><Key className="h-4 w-4 text-lnx-navy-800" /><div><div className="text-sm font-medium">Password</div><div className="text-xs text-muted-foreground">Last changed 45 days ago</div></div></div><Button variant="outline" size="sm">Change</Button></div>
              <div className="flex items-center justify-between rounded-lg border p-3"><div className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-lnx-navy-800" /><div><div className="text-sm font-medium">Two-Factor Authentication</div><div className="text-xs text-muted-foreground">Add SMS OTP on login</div></div></div><Switch /></div>
              <div className="flex items-center justify-between rounded-lg border p-3"><div className="flex items-center gap-2"><Lock className="h-4 w-4 text-lnx-navy-800" /><div><div className="text-sm font-medium">Active Sessions</div><div className="text-xs text-muted-foreground">1 device · this browser</div></div></div><Button variant="outline" size="sm">Sign out others</Button></div>
            </Card>
          </TabsContent>
          <TabsContent value="notifications">
            <Card className="p-5 space-y-3">
              {["Email · Daily digest","Email · Real-time alerts","SMS · Critical only","WhatsApp · Announcements"].map(k => (
                <div key={k} className="flex items-center justify-between border-b pb-3 last:border-0"><span className="text-sm">{k}</span><Switch defaultChecked /></div>
              ))}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  },
});
