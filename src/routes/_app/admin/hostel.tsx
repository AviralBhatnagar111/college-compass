import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Building2, Plus, Utensils } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/hostel")({
  head: () => ({ meta: [{ title: "Hostel — LearnNowX" }] }),
  component: HostelPage,
});

interface Block { id: string; name: string; gender: "M" | "F"; rooms: number; capacity: number; occupied: number; warden: string; }
const BLOCKS: Block[] = [
  { id: "BB1", name: "Boys Block A", gender: "M", rooms: 60, capacity: 120, occupied: 98, warden: "Mr. Sanjay Kumar" },
  { id: "BB2", name: "Boys Block B", gender: "M", rooms: 50, capacity: 100, occupied: 75, warden: "Mr. Ravi Sinha" },
  { id: "GB1", name: "Girls Block A", gender: "F", rooms: 40, capacity: 80, occupied: 62, warden: "Mrs. Kavita Joshi" },
];
const ALLOTMENTS = [
  { id: "A1", student: "Vikas Chauhan", room: "BB1-201", check: "2025-08-12" },
  { id: "A2", student: "Priya Sharma", room: "GB1-105", check: "2025-08-12" },
  { id: "A3", student: "Karan Iyer", room: "BB1-204", check: "2025-08-12" },
];
const COMPLAINTS = [
  { id: "C1", student: "Vikas Chauhan", room: "BB1-201", issue: "Fan not working", status: "open", date: "2026-06-28" },
  { id: "C2", student: "Rahul Verma", room: "BB2-110", issue: "Water leakage", status: "in-progress", date: "2026-06-25" },
];

function HostelPage() {
  const [open, setOpen] = useState<Block | null>(null);
  const [complaints, setComplaints] = useState(COMPLAINTS);

  const totalCap = BLOCKS.reduce((s, b) => s + b.capacity, 0);
  const totalOcc = BLOCKS.reduce((s, b) => s + b.occupied, 0);

  return (
    <div>
      <PageHeader title="Hostel & Accommodation" subtitle="Blocks, allotment, mess and complaints" action={<Button><Plus className="h-4 w-4 mr-2" />Allot room</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Blocks</div><div className="mt-1 text-2xl font-semibold tabular">{BLOCKS.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Capacity</div><div className="mt-1 text-2xl font-semibold tabular">{totalCap}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Occupied</div><div className="mt-1 text-2xl font-semibold tabular text-lnx-teal-500">{totalOcc} ({Math.round((totalOcc/totalCap)*100)}%)</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Open complaints</div><div className="mt-1 text-2xl font-semibold tabular text-lnx-amber-500">{complaints.filter(c => c.status !== "resolved").length}</div></Card>
      </div>

      <Tabs defaultValue="blocks">
        <TabsList><TabsTrigger value="blocks">Blocks</TabsTrigger><TabsTrigger value="allotment">Allotment</TabsTrigger><TabsTrigger value="mess">Mess</TabsTrigger><TabsTrigger value="complaints">Complaints</TabsTrigger></TabsList>
        <TabsContent value="blocks" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {BLOCKS.map(b => (
              <Card key={b.id} className="p-4 cursor-pointer" onClick={() => setOpen(b)}>
                <div className="flex items-center justify-between"><Building2 className="h-4 w-4 text-lnx-navy-800" /><Badge variant="outline">{b.gender === "M" ? "Boys" : "Girls"}</Badge></div>
                <h3 className="mt-2 font-semibold text-lnx-navy-800">{b.name}</h3>
                <p className="text-xs text-muted-foreground">{b.rooms} rooms · {b.warden}</p>
                <div className="mt-3"><div className="flex justify-between text-xs mb-1"><span>Occupancy</span><span className="tabular">{b.occupied}/{b.capacity}</span></div><div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-lnx-teal-500" style={{ width: `${(b.occupied/b.capacity)*100}%` }} /></div></div>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="allotment" className="mt-4">
          <Card><Table>
            <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Room</TableHead><TableHead>Check-in</TableHead></TableRow></TableHeader>
            <TableBody>{ALLOTMENTS.map(a => <TableRow key={a.id}><TableCell>{a.student}</TableCell><TableCell>{a.room}</TableCell><TableCell className="text-xs">{a.check}</TableCell></TableRow>)}</TableBody>
          </Table></Card>
        </TabsContent>
        <TabsContent value="mess" className="mt-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3"><Utensils className="h-4 w-4 text-lnx-teal-500" /><h3 className="font-semibold text-lnx-navy-800">Weekly Menu</h3></div>
            <div className="grid grid-cols-2 md:grid-cols-7 gap-2 text-xs">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                <div key={d} className="rounded border p-2"><div className="font-semibold">{d}</div><div className="text-muted-foreground mt-1">Veg thali · Roti · Dal · Sabzi {i % 2 === 0 ? "· Paneer" : "· Chicken"}</div></div>
              ))}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="complaints" className="mt-4">
          <Card><Table>
            <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Room</TableHead><TableHead>Issue</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>{complaints.map(c => (
              <TableRow key={c.id}><TableCell>{c.student}</TableCell><TableCell>{c.room}</TableCell><TableCell>{c.issue}</TableCell><TableCell><Badge variant={c.status === "open" ? "destructive" : "outline"}>{c.status}</Badge></TableCell><TableCell><Button size="sm" variant="outline" onClick={() => { setComplaints(p => p.map(x => x.id === c.id ? { ...x, status: "resolved" } : x)); toast.success("Marked resolved"); }}>Resolve</Button></TableCell></TableRow>
            ))}</TableBody>
          </Table></Card>
        </TabsContent>
      </Tabs>

      <Sheet open={!!open} onOpenChange={v => !v && setOpen(null)}>
        <SheetContent>
          {open && (<>
            <SheetHeader><SheetTitle>{open.name}</SheetTitle></SheetHeader>
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Rooms:</span> {open.rooms}</p>
              <p><span className="text-muted-foreground">Capacity:</span> {open.capacity}</p>
              <p><span className="text-muted-foreground">Occupied:</span> {open.occupied} ({Math.round((open.occupied/open.capacity)*100)}%)</p>
              <p><span className="text-muted-foreground">Warden:</span> {open.warden}</p>
            </div>
          </>)}
        </SheetContent>
      </Sheet>
    </div>
  );
}
