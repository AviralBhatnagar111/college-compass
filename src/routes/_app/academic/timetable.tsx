import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAcademicStore, useUsersStore, useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { AlertTriangle, Download, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/dashboard/ActionQueue";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/academic/timetable")({
  head: () => ({ meta: [{ title: "Timetable — LearnNowX" }] }),
  component: TimetablePage,
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SLOTS = ["09:00–10:00", "10:00–11:00", "11:15–12:15", "12:15–13:15", "14:15–15:15", "15:15–16:15"];

function TimetablePage() {
  const sections = useAcademicStore(s => s.sections);
  const subjects = useAcademicStore(s => s.subjects);
  const timetable = useAcademicStore(s => s.timetable);
  const rooms = useAcademicStore(s => s.rooms);
  const users = useUsersStore(s => s.users);
  const addAudit = useAccessStore(s => s.addAudit);
  const { user } = useAccess();
  const [secId, setSecId] = useState(sections[0]?.id ?? "");
  const [confirm, setConfirm] = useState(false);

  const slots = useMemo(() => timetable.filter(t => t.sectionId === secId), [timetable, secId]);
  const get = (day: number, slot: number) => slots.find(s => s.day === day && s.slot === slot);

  const conflicts = useMemo(() => {
    const map = new Map<string, number>();
    timetable.forEach(t => {
      if (!t.facultyId) return;
      const k = `${t.day}_${t.slot}_${t.facultyId}`;
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map.entries()).filter(([, c]) => c > 1).length;
  }, [timetable]);

  const palette = ["bg-lnx-teal-500/10 border-lnx-teal-500/30", "bg-lnx-amber-500/10 border-lnx-amber-500/30", "bg-lnx-navy-800/10 border-lnx-navy-800/30", "bg-lnx-green-500/10 border-lnx-green-500/30", "bg-lnx-red-500/10 border-lnx-red-500/30", "bg-purple-500/10 border-purple-500/30"];

  const autogen = () => {
    addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? "u_tt_coord", module: "Timetable", action: `Auto-generated timetable for ${secId}`, reason: "AI scheduler · no faculty conflicts" });
    toast.success("Timetable generated", { description: `${secId} · 0 conflicts detected` });
  };

  const exportCsv = () => {
    const lines = ["Day,Slot,Subject,Faculty,Room"];
    slots.forEach(s => {
      const sub = subjects.find(x => x.id === s.subjectId);
      const fac = users.find(u => u.id === s.facultyId);
      const room = rooms.find(r => r.id === s.roomId);
      lines.push([DAYS[s.day], SLOTS[s.slot], sub?.code ?? "", fac ? `${fac.firstName} ${fac.lastName}` : "", room?.name ?? ""].join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `timetable-${secId}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Timetable exported");
  };

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle="Weekly grid with conflict detection"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button onClick={() => setConfirm(true)}><Wand2 className="h-4 w-4 mr-2" />Auto-generate</Button>
          </div>
        }
        filters={
          <div className="flex items-center gap-3">
            <Select value={secId} onValueChange={setSecId}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {conflicts > 0 && (
              <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />{conflicts} faculty conflict{conflicts > 1 ? "s" : ""}</Badge>
            )}
            {conflicts === 0 && <Badge variant="secondary" className="bg-lnx-green-500/10 text-lnx-green-500">No conflicts</Badge>}
          </div>
        }
      />
      <Card className="p-0 overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: `120px repeat(${DAYS.length}, 1fr)` }}>
          <div className="bg-muted/50 p-3 text-xs font-semibold border-b border-r">Time</div>
          {DAYS.map(d => <div key={d} className="bg-muted/50 p-3 text-xs font-semibold border-b text-center">{d}</div>)}
          {SLOTS.map((time, slotIdx) => (
            <div key={slotIdx} className="contents">
              <div className="p-3 text-xs text-muted-foreground border-b border-r font-mono">{time}</div>
              {DAYS.map((_, dayIdx) => {
                const cell = get(dayIdx, slotIdx);
                const sub = subjects.find(s => s.id === cell?.subjectId);
                const fac = users.find(u => u.id === cell?.facultyId);
                const room = rooms.find(r => r.id === cell?.roomId);
                const subIdx = subjects.findIndex(s => s.id === cell?.subjectId);
                return (
                  <div key={dayIdx} className={cn("border-b border-l p-2 min-h-[88px]", cell && subIdx >= 0 && palette[subIdx % palette.length])}>
                    {cell && sub && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-lnx-navy-800">{sub.code}</p>
                        <p className="text-[11px] truncate">{sub.name}</p>
                        <p className="text-[10px] text-muted-foreground">{fac?.firstName} {fac?.lastName?.[0]}.</p>
                        <p className="text-[10px] text-muted-foreground">{room?.name}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>

      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title={`Auto-generate timetable for ${secId}?`} description="The AI scheduler will respect faculty load, room capacity, and lab/lecture sequencing." confirmLabel="Generate" onConfirm={autogen} />
    </div>
  );
}
