import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAcademicStore, useUsersStore, useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { Plus, Users, MapPin, DoorOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/academic/classes")({
  head: () => ({ meta: [{ title: "Classes & Rooms — LearnNowX" }] }),
  component: ClassesPage,
});

function ClassesPage() {
  const sections = useAcademicStore(s => s.sections);
  const programs = useAcademicStore(s => s.programs);
  const rooms = useAcademicStore(s => s.rooms);
  const users = useUsersStore(s => s.users);
  const timetable = useAcademicStore(s => s.timetable);
  const addSection = useAcademicStore(s => s.addSection);
  const addRoom = useAcademicStore(s => s.addRoom);
  const addAudit = useAccessStore(s => s.addAudit);
  const { user } = useAccess();
  const [tab, setTab] = useState("sections");
  const [open, setOpen] = useState(false);
  const [secDetail, setSecDetail] = useState<string | null>(null);
  const [roomDetail, setRoomDetail] = useState<string | null>(null);
  const [secForm, setSecForm] = useState({ name: "", programId: "P_CSE", batch: "2026-30", strength: 60 });
  const [roomForm, setRoomForm] = useState({ name: "", type: "Lecture" as const, capacity: 60 });

  const selSec = sections.find(s => s.id === secDetail);
  const selRoom = rooms.find(r => r.id === roomDetail);
  const roster = selSec ? users.filter(u => u.sectionId === selSec.id && u.role === "student") : [];
  const teacher = selSec ? users.find(u => (u.role === "faculty") && u.scope.ids.includes(selSec.id)) : null;
  const roomSlots = selRoom ? timetable.filter(t => t.roomId === selRoom.id) : [];
  const utilisation = selRoom ? Math.round((roomSlots.length / 30) * 100) : 0;

  const createSection = () => {
    if (!secForm.name) return;
    const id = `SEC_${secForm.name.replace(/\s/g,"")}_${Date.now().toString(36)}`;
    addSection({ id, ...secForm });
    addAudit({ id: `aud_${Date.now()}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hoi", module: "Academic", action: `Created Section: ${secForm.name}` });
    toast.success("Section added");
    setOpen(false); setSecForm({ name: "", programId: "P_CSE", batch: "2026-30", strength: 60 });
  };
  const createRoom = () => {
    if (!roomForm.name) return;
    const id = roomForm.name.replace(/\s/g,"-");
    addRoom({ id, ...roomForm });
    addAudit({ id: `aud_${Date.now()}`, at: new Date().toISOString(), actorId: user?.id ?? "u_hoi", module: "Academic", action: `Added Room: ${roomForm.name}` });
    toast.success("Room added");
    setOpen(false); setRoomForm({ name: "", type: "Lecture", capacity: 60 });
  };

  return (
    <div>
      <PageHeader title="Classes & Rooms" subtitle="Sections, batches and physical spaces"
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Add {tab === "sections" ? "Section" : "Room"}</Button>} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="sections"><Users className="h-4 w-4 mr-1" />Sections ({sections.length})</TabsTrigger>
          <TabsTrigger value="rooms"><DoorOpen className="h-4 w-4 mr-1" />Rooms ({rooms.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="sections" className="mt-4">
          <Card className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Section</TableHead><TableHead>Program</TableHead><TableHead>Batch</TableHead><TableHead>Strength</TableHead><TableHead>Enrolled</TableHead></TableRow></TableHeader>
              <TableBody>
                {sections.map(sec => {
                  const enrolled = users.filter(u => u.sectionId === sec.id).length;
                  return (
                    <TableRow key={sec.id} className="cursor-pointer hover:bg-accent/40" onClick={() => setSecDetail(sec.id)}>
                      <TableCell className="font-medium">{sec.name}</TableCell>
                      <TableCell>{programs.find(p => p.id === sec.programId)?.name}</TableCell>
                      <TableCell>{sec.batch}</TableCell>
                      <TableCell><Badge variant="secondary">{sec.strength}</Badge></TableCell>
                      <TableCell>{enrolled}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="rooms" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map(r => {
              const util = Math.round((timetable.filter(t => t.roomId === r.id).length / 30) * 100);
              return (
                <Card key={r.id} className="p-5 cursor-pointer hover:border-lnx-teal-500 transition" onClick={() => setRoomDetail(r.id)}>
                  <div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-wide text-muted-foreground">{r.type}</p><h3 className="mt-1 text-lg font-semibold text-lnx-navy-800">{r.name}</h3></div><Badge variant="outline"><Users className="h-3 w-3 mr-1" />{r.capacity}</Badge></div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />Main Campus · {util}% utilised</div>
                  {util === 0 && <Badge variant="outline" className="mt-2 border-lnx-amber-500/30 text-lnx-amber-500">Idle</Badge>}
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add {tab === "sections" ? "Section" : "Room"}</DialogTitle></DialogHeader>
          {tab === "sections" ? (
            <div className="space-y-3 py-2">
              <div><Label>Name</Label><Input value={secForm.name} onChange={e => setSecForm({...secForm, name: e.target.value})} placeholder="CSE-A3" /></div>
              <div><Label>Program</Label><Select value={secForm.programId} onValueChange={v => setSecForm({...secForm, programId: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-2"><div><Label>Batch</Label><Input value={secForm.batch} onChange={e => setSecForm({...secForm, batch: e.target.value})} /></div><div><Label>Strength</Label><Input type="number" value={secForm.strength} onChange={e => setSecForm({...secForm, strength: +e.target.value})} /></div></div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div><Label>Room Name / Number</Label><Input value={roomForm.name} onChange={e => setRoomForm({...roomForm, name: e.target.value})} placeholder="LH-109" /></div>
              <div className="grid grid-cols-2 gap-2"><div><Label>Type</Label><Select value={roomForm.type} onValueChange={v => setRoomForm({...roomForm, type: v as any})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Lecture">Lecture</SelectItem><SelectItem value="Lab">Lab</SelectItem><SelectItem value="Seminar">Seminar</SelectItem><SelectItem value="Auditorium">Auditorium</SelectItem></SelectContent></Select></div><div><Label>Capacity</Label><Input type="number" value={roomForm.capacity} onChange={e => setRoomForm({...roomForm, capacity: +e.target.value})} /></div></div>
            </div>
          )}
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={tab === "sections" ? createSection : createRoom}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!secDetail} onOpenChange={v => !v && setSecDetail(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px]">
          <SheetHeader><SheetTitle>{selSec?.name}</SheetTitle></SheetHeader>
          {selSec && (
            <div className="mt-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Program</p><p className="font-medium">{programs.find(p=>p.id===selSec.programId)?.name}</p></div>
                <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Batch</p><p className="font-medium">{selSec.batch}</p></div>
                <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Strength</p><p className="font-medium">{selSec.strength}</p></div>
                <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Enrolled</p><p className="font-medium">{roster.length}</p></div>
              </div>
              <div className="rounded-md bg-accent p-3 text-xs"><p className="font-medium">Class Teacher / Mentor</p><p className="text-muted-foreground">{teacher ? `${teacher.firstName} ${teacher.lastName} · ${teacher.designation}` : "Unassigned"}</p></div>
              <div><p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Roster ({roster.length})</p><div className="space-y-1 max-h-60 overflow-auto">{roster.slice(0,30).map(s => <div key={s.id} className="flex justify-between rounded border p-2 text-xs"><span>{s.firstName} {s.lastName}</span><span className="text-muted-foreground font-mono">{s.rollNo}</span></div>)}</div></div>
              <div className="rounded-md border p-3 text-xs"><p className="font-medium mb-1">Attendance Summary</p><p className="text-muted-foreground">Avg: {Math.round(roster.reduce((a,s)=>a+(s.attendancePct??0),0)/(roster.length||1))}% · Below 75%: {roster.filter(s=>(s.attendancePct??0)<75).length}</p></div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={!!roomDetail} onOpenChange={v => !v && setRoomDetail(null)}>
        <SheetContent className="w-[420px] sm:max-w-[420px]">
          <SheetHeader><SheetTitle>{selRoom?.name}</SheetTitle></SheetHeader>
          {selRoom && (
            <div className="mt-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Type</p><p className="font-medium">{selRoom.type}</p></div>
                <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Capacity</p><p className="font-medium">{selRoom.capacity}</p></div>
              </div>
              <div className="rounded-md bg-accent p-3 text-xs"><p className="font-medium mb-1">Weekly utilisation</p><div className="h-2 rounded bg-background overflow-hidden"><div className="h-full bg-lnx-teal-500" style={{ width: `${Math.min(utilisation, 100)}%` }} /></div><p className="text-muted-foreground mt-1">{roomSlots.length} of 30 slots used · {utilisation}%</p></div>
              {roomSlots.length === 0 && <Badge variant="outline" className="border-lnx-amber-500/30 text-lnx-amber-500">Idle room — no slots booked</Badge>}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
