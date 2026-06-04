import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { Plus, Download, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_app/academic/calendar")({
  head: () => ({ meta: [{ title: "Academic Calendar — LearnNowX" }] }),
  component: CalendarPage,
});

type EvType = "semester" | "holiday" | "internal-exam" | "external-exam" | "ptm" | "fdp" | "event" | "fee-due" | "accreditation";
interface Event { id: string; title: string; type: EvType; date: string; audience: string; }

const TYPE_COLOR: Record<EvType, string> = {
  "semester": "bg-lnx-navy-800 text-white",
  "holiday": "bg-lnx-red-500/15 text-lnx-red-500",
  "internal-exam": "bg-lnx-amber-500/15 text-lnx-amber-500",
  "external-exam": "bg-lnx-amber-500/30 text-lnx-amber-500",
  "ptm": "bg-lnx-teal-500/15 text-lnx-teal-500",
  "fdp": "bg-purple-500/15 text-purple-600",
  "event": "bg-blue-500/15 text-blue-600",
  "fee-due": "bg-lnx-red-500/10 text-lnx-red-500",
  "accreditation": "bg-lnx-green-500/15 text-lnx-green-500",
};

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const today = () => { const d = new Date(); return d; };
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };

function CalendarPage() {
  const { user } = useAccess();
  const addAudit = useAccessStore(s => s.addAudit);
  const audit = (a: string, r?: string) => addAudit({ id: `a_${Date.now()}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hoi", module: "Calendar", action: a, reason: r });

  const t = today();
  const [events, setEvents] = useState<Event[]>([
    { id: "E1", title: "Semester 5 begins", type: "semester", date: ymd(addDays(t, -40)), audience: "All" },
    { id: "E2", title: "Diwali break", type: "holiday", date: ymd(addDays(t, -10)), audience: "All" },
    { id: "E3", title: "Mid-Sem Exams (Internal-2)", type: "internal-exam", date: ymd(addDays(t, 7)), audience: "Students" },
    { id: "E4", title: "PTM — All Sections", type: "ptm", date: ymd(addDays(t, 12)), audience: "Parents, Faculty" },
    { id: "E5", title: "Fee Installment 2 Due", type: "fee-due", date: ymd(addDays(t, 15)), audience: "Students, Parents" },
    { id: "E6", title: "FDP: Outcome-Based Education", type: "fdp", date: ymd(addDays(t, 20)), audience: "Faculty" },
    { id: "E7", title: "End-Sem Exams (External)", type: "external-exam", date: ymd(addDays(t, 45)), audience: "Students" },
    { id: "E8", title: "NIRF data submission", type: "accreditation", date: ymd(addDays(t, 28)), audience: "IQAC" },
    { id: "E9", title: "Annual Tech Fest", type: "event", date: ymd(addDays(t, 35)), audience: "All" },
    { id: "E10", title: "AQAR 2025-26 deadline", type: "accreditation", date: "2026-12-31", audience: "IQAC" },
  ]);

  const [month, setMonth] = useState(new Date(t.getFullYear(), t.getMonth(), 1));
  const [openNew, setOpenNew] = useState(false);
  const [ne, setNe] = useState<{ title: string; type: EvType; date: string; audience: string }>({ title: "", type: "event", date: ymd(t), audience: "All" });

  const submit = () => {
    if (!ne.title) { toast.error("Title required"); return; }
    const e: Event = { id: `E_${Date.now()}`, ...ne };
    setEvents([...events, e]);
    audit("Added calendar event", `${ne.title} on ${ne.date}`);
    toast.success("Event added · cascaded to relevant dashboards");
    setOpenNew(false); setNe({ title: "", type: "event", date: ymd(t), audience: "All" });
  };

  const monthEvents = useMemo(() => {
    const m = month.getMonth(), y = month.getFullYear();
    return events.filter(e => { const d = new Date(e.date); return d.getMonth() === m && d.getFullYear() === y; });
  }, [events, month]);

  // Build month grid (6 weeks × 7 days)
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth()+1, 0).getDate();
  const cells: { day?: number; events: Event[] }[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ events: [] });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = ymd(new Date(month.getFullYear(), month.getMonth(), d));
    cells.push({ day: d, events: events.filter(e => e.date === dateStr) });
  }
  while (cells.length % 7 !== 0) cells.push({ events: [] });

  return (
    <div>
      <PageHeader title="Academic Calendar" subtitle="Semesters · Holidays · Exams · PTM · FDPs · Accreditation deadlines"
        action={<div className="flex gap-2"><Button variant="outline" onClick={()=>{audit("Exported calendar"); toast.success("Calendar.ics downloaded");}}><Download className="h-4 w-4 mr-2" />Export</Button><Button onClick={()=>setOpenNew(true)}><Plus className="h-4 w-4 mr-2" />Add Event</Button></div>} />

      <Tabs defaultValue="month">
        <div className="flex items-center justify-between mb-4">
          <TabsList><TabsTrigger value="month">Month</TabsTrigger><TabsTrigger value="list">List</TabsTrigger></TabsList>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={()=>setMonth(new Date(month.getFullYear(), month.getMonth()-1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-semibold text-lnx-navy-800 w-32 text-center">{month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
            <Button variant="ghost" size="icon" onClick={()=>setMonth(new Date(month.getFullYear(), month.getMonth()+1, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>

        <TabsContent value="month">
          <Card className="p-4">
            <div className="grid grid-cols-7 gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="px-2 py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((c, i) => (
                <div key={i} className={`min-h-24 border rounded-md p-1.5 text-xs ${c.day ? "bg-card" : "bg-muted/30"}`}>
                  {c.day && <div className="font-semibold text-lnx-navy-800 mb-1">{c.day}</div>}
                  <div className="space-y-1">{c.events.map(e => (
                    <div key={e.id} className={`px-1.5 py-0.5 rounded text-[10px] truncate ${TYPE_COLOR[e.type]}`} title={e.title}>{e.title}</div>
                  ))}</div>
                </div>
              ))}
            </div>
          </Card>
          {monthEvents.length > 0 && <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {(["semester","holiday","internal-exam","external-exam","ptm","fdp","event","fee-due","accreditation"] as EvType[]).map(t => (
              <Badge key={t} variant="outline" className={TYPE_COLOR[t]}>{t}</Badge>
            ))}
          </div>}
        </TabsContent>

        <TabsContent value="list" className="space-y-2">
          {[...events].sort((a,b)=>a.date.localeCompare(b.date)).map(e => (
            <Card key={e.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-12 rounded ${TYPE_COLOR[e.type].split(" ")[0]}`} />
                <div><div className="font-medium text-sm text-lnx-navy-800">{e.title}</div><div className="text-xs text-muted-foreground">{fmt(e.date)} · {e.audience}</div></div>
              </div>
              <Badge variant="outline" className={TYPE_COLOR[e.type]}>{e.type}</Badge>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent><DialogHeader><DialogTitle>Add Calendar Event</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Title</Label><Input value={ne.title} onChange={e=>setNe({...ne, title:e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label><Select value={ne.type} onValueChange={(v: any)=>setNe({...ne, type:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                {(["semester","holiday","internal-exam","external-exam","ptm","fdp","event","fee-due","accreditation"] as EvType[]).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent></Select></div>
              <div><Label>Date</Label><Input type="date" value={ne.date} onChange={e=>setNe({...ne, date:e.target.value})} /></div>
            </div>
            <div><Label>Audience</Label><Input value={ne.audience} onChange={e=>setNe({...ne, audience:e.target.value})} placeholder="All / Students / Faculty / Parents" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setOpenNew(false)}>Cancel</Button><Button onClick={submit}>Add Event</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
