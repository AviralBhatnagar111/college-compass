import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useCommStore } from "@/stores";
import { Plus, Bell, Mail, MessageSquare, Send, FileText as FT, Eye } from "lucide-react";
import { useState } from "react";
import { KpiCard } from "@/components/common/KpiCard";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/communication/announcements")({
  head: () => ({ meta: [{ title: "Announcements — LearnNowX" }] }),
  component: AnnouncementsPage,
});

const TEMPLATES = [
  { id: "T1", name: "Fee Reminder", body: "Dear {{parent_name}}, this is a reminder that {{installment}} for {{student_name}} ({{roll_no}}) is due on {{due_date}}.", channels: ["email","sms"] },
  { id: "T2", name: "Attendance Alert", body: "Attendance for {{student_name}} has dropped below 75% in {{subject}}. Please ensure regular presence.", channels: ["email","whatsapp"] },
  { id: "T3", name: "Exam Schedule", body: "{{exam_name}} for {{section}} is scheduled on {{date}} at {{time}} in {{room}}. Bring your hall ticket.", channels: ["email","sms"] },
  { id: "T4", name: "Result Published", body: "{{student_name}}, your result for {{exam}} has been published. Login to view your grade card.", channels: ["email","sms","whatsapp"] },
  { id: "T5", name: "Placement Drive", body: "{{company}} is conducting placement drive on {{date}}. Eligibility: CGPA ≥ {{cgpa}}. Apply by {{deadline}}.", channels: ["email","whatsapp"] },
];

function AnnouncementsPage() {
  const list = useCommStore(s => s.announcements);
  const [open, setOpen] = useState(false);
  const totalReach = list.reduce((s,a)=>s+a.delivered,0);
  const openRate = Math.round(list.reduce((s,a)=>s+a.opened,0)/Math.max(1,list.reduce((s,a)=>s+a.delivered,0))*100);

  return (
    <div>
      <PageHeader title="Announcements" subtitle="Broadcast across email, SMS and WhatsApp"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Announcement</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Compose Announcement</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                <div><Label>Title</Label><Input placeholder="e.g. Library closure notice" /></div>
                <div><Label>Audience</Label><Input placeholder="Students, CSE, Final Year" /></div>
                <div><Label>Body</Label><Textarea rows={5} placeholder="Type your message..." /></div>
                <div><Label className="mb-2 block">Channels</Label>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="cursor-pointer"><Mail className="h-3 w-3 mr-1" />Email</Badge>
                    <Badge variant="secondary" className="cursor-pointer"><MessageSquare className="h-3 w-3 mr-1" />SMS</Badge>
                    <Badge variant="outline" className="cursor-pointer"><MessageSquare className="h-3 w-3 mr-1" />WhatsApp</Badge>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline"><Eye className="h-4 w-4 mr-2" />Preview</Button>
                <Button onClick={() => { toast.success("Announcement queued for delivery"); setOpen(false); }}><Send className="h-4 w-4 mr-2" />Send</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        } />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Announcements" value={list.length} icon={Bell} tone="teal" />
        <KpiCard label="Total Reach" value={totalReach.toLocaleString()} icon={Send} />
        <KpiCard label="Open Rate" value={`${openRate}%`} icon={Eye} tone="green" />
        <KpiCard label="Templates" value={TEMPLATES.length} icon={FT} tone="amber" />
      </div>
      <Tabs defaultValue="sent">
        <TabsList>
          <TabsTrigger value="sent">Sent ({list.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({TEMPLATES.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="sent" className="mt-4 space-y-3">
          {list.map(a => (
            <Card key={a.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lnx-navy-800">{a.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{a.body}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {a.audience.map(x => <Badge key={x} variant="outline" className="text-[10px]">{x}</Badge>)}
                  </div>
                </div>
                <div className="text-right shrink-0 min-w-[180px]">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{new Date(a.sentAt).toLocaleDateString()}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div><p className="font-semibold tabular">{a.sent}</p><p className="text-muted-foreground">Sent</p></div>
                    <div><p className="font-semibold tabular text-lnx-teal-500">{a.delivered}</p><p className="text-muted-foreground">Delivered</p></div>
                    <div><p className="font-semibold tabular text-lnx-green-500">{a.opened}</p><p className="text-muted-foreground">Opened</p></div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="templates" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEMPLATES.map(t => (
              <Card key={t.id} className="p-5">
                <div className="flex items-start justify-between mb-2"><h4 className="font-semibold">{t.name}</h4><div className="flex gap-1">{t.channels.map(c => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}</div></div>
                <p className="text-xs text-muted-foreground leading-relaxed font-mono bg-muted/40 rounded p-2">{t.body}</p>
                <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" className="flex-1">Edit</Button><Button size="sm" className="flex-1">Use</Button></div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
