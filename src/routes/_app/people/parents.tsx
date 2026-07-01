import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar } from "@/components/common/Avatar";
import { useUsersStore } from "@/stores";
import { Search, MessageSquare, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/people/parents")({
  head: () => ({ meta: [{ title: "Parents — LearnNowX" }] }),
  component: ParentsPage,
});

const PTM_DATES = [
  { id: "ptm1", date: "2026-04-12", topic: "Mid-Sem performance review", attended: true, notes: "Discussed attendance concerns. Parent committed to weekly check-ins." },
  { id: "ptm2", date: "2026-02-08", topic: "Backlog clearance plan", attended: true, notes: "Mentor assigned remedial sessions for MAT201." },
  { id: "ptm3", date: "2025-11-22", topic: "Onboarding & expectations", attended: false, notes: "Did not attend; rescheduled to virtual call." },
];

function ParentsPage() {
  const users = useUsersStore(s => s.users);
  const parents = users.filter(u => u.role === "parent");
  const [q, setQ] = useState("");
  const [view, setView] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const filtered = parents.filter(p => !q || `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(q.toLowerCase()));
  const viewing = parents.find(p => p.id === view);
  const child = viewing ? users.find(u => u.id === viewing.childId) : null;

  const ptm = useMemo(() => PTM_DATES, []);
  const submitFeedback = () => {
    if (!feedback.trim()) { toast.error("Add some text"); return; }
    toast.success("Feedback logged and routed to mentor");
    setFeedback("");
  };

  return (
    <div>
      <PageHeader title="Parents" subtitle={`${parents.length} parent accounts linked`} filters={
        <div className="relative max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} className="pl-9" /></div>
      } />
      <Card className="p-0">
        <table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-2">Parent</th><th>Child</th><th>Section</th><th>Phone</th><th></th></tr></thead>
          <tbody className="divide-y">{filtered.map(p => {
            const c = users.find(u => u.id === p.childId);
            return (
              <tr key={p.id} className="hover:bg-accent/40 cursor-pointer" onClick={() => setView(p.id)}>
                <td className="px-4 py-2"><div className="flex items-center gap-2"><Avatar initials={p.initials} color={p.avatarColor} size="sm" /><div><div className="font-medium text-lnx-navy-800">{p.firstName} {p.lastName}</div><div className="text-xs text-muted-foreground">{p.email}</div></div></div></td>
                <td>{c?.firstName} {c?.lastName}</td>
                <td className="text-xs">{c?.sectionId ?? "—"}</td>
                <td className="text-xs">{p.phone}</td>
                <td className="text-right pr-3"><Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setView(p.id); }}>View</Button></td>
              </tr>
            );
          })}</tbody></table>
      </Card>

      <Sheet open={!!view} onOpenChange={(v) => !v && setView(null)}>
        <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
          {viewing && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar initials={viewing.initials} color={viewing.avatarColor} size="lg" />
                  <div>
                    <SheetTitle>{viewing.firstName} {viewing.lastName}</SheetTitle>
                    <p className="text-xs text-muted-foreground">{viewing.email} · {viewing.phone}</p>
                  </div>
                </div>
              </SheetHeader>
              <Tabs defaultValue="profile" className="mt-4">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="child">Child</TabsTrigger>
                  <TabsTrigger value="ptm">PTM Records</TabsTrigger>
                  <TabsTrigger value="feedback">Feedback</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-3 text-sm">
                  <Card className="p-4 space-y-2">
                    <Row k="Email" v={viewing.email} />
                    <Row k="Phone" v={viewing.phone ?? "—"} />
                    <Row k="Login method" v={<Badge variant="outline">{viewing.loginMethod}</Badge>} />
                    <Row k="Status" v={<Badge>{viewing.status}</Badge>} />
                    <Row k="Account created" v={new Date(viewing.createdAt).toLocaleDateString()} />
                  </Card>
                  <div className="grid grid-cols-3 gap-2">
                    <Button size="sm" variant="outline" onClick={() => toast.success("Email opened")}><Mail className="h-3 w-3 mr-1" />Email</Button>
                    <Button size="sm" variant="outline" onClick={() => toast.success(`Calling ${viewing.phone}…`)}><Phone className="h-3 w-3 mr-1" />Call</Button>
                    <Button size="sm" onClick={() => toast.success("WhatsApp queued")}><MessageSquare className="h-3 w-3 mr-1" />WhatsApp</Button>
                  </div>
                </TabsContent>

                <TabsContent value="child" className="space-y-3 text-sm">
                  {child ? (
                    <Card className="p-4">
                      <Link to="/people/students/$id" params={{ id: child.id }} className="font-medium hover:underline text-base">{child.firstName} {child.lastName}</Link>
                      <p className="text-xs text-muted-foreground mb-3">{child.rollNo} · {child.sectionId}</p>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div><p className="text-xl font-semibold">{child.cgpa?.toFixed(2)}</p><p className="text-[11px] text-muted-foreground">CGPA</p></div>
                        <div><p className="text-xl font-semibold">{child.attendancePct}%</p><p className="text-[11px] text-muted-foreground">Attendance</p></div>
                        <div><p className="text-xl font-semibold">{child.backlogs ?? 0}</p><p className="text-[11px] text-muted-foreground">Backlogs</p></div>
                      </div>
                      <Button asChild size="sm" className="w-full mt-3"><Link to="/people/students/$id" params={{ id: child.id }}>Open full profile</Link></Button>
                    </Card>
                  ) : <p className="text-xs text-muted-foreground">No linked child found.</p>}
                </TabsContent>

                <TabsContent value="ptm" className="space-y-2 text-sm">
                  {ptm.map(m => (
                    <Card key={m.id} className="p-3">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-sm">{new Date(m.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                        <Badge variant="outline" className={m.attended ? "bg-lnx-green-500/10 text-lnx-green-500" : "bg-lnx-amber-500/10 text-lnx-amber-500"}>{m.attended ? "Attended" : "Missed"}</Badge>
                      </div>
                      <p className="text-xs font-medium mt-1">{m.topic}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{m.notes}</p>
                    </Card>
                  ))}
                  <Button size="sm" variant="outline" className="w-full" onClick={() => toast.success("PTM invite sent")}>Schedule new PTM</Button>
                </TabsContent>

                <TabsContent value="feedback" className="space-y-3 text-sm">
                  <Card className="p-3 space-y-2">
                    <div className="text-xs"><span className="text-muted-foreground">21 Apr 2026 · </span>"Mentor has been very supportive. Attendance has improved."</div>
                    <div className="text-xs"><span className="text-muted-foreground">06 Feb 2026 · </span>"Request for additional mentoring on MAT201."</div>
                    <div className="text-xs"><span className="text-muted-foreground">14 Dec 2025 · </span>"Library closing time should be extended during exams."</div>
                  </Card>
                  <Card className="p-3 space-y-2">
                    <p className="text-xs font-medium">Log new feedback / concern</p>
                    <Textarea rows={3} placeholder="Capture parent's concern or feedback…" value={feedback} onChange={e => setFeedback(e.target.value)} />
                    <Button size="sm" className="w-full" onClick={submitFeedback}>Log & route to mentor</Button>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between text-sm"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>;
}
