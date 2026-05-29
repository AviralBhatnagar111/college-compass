import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAcademicStore, useUsersStore } from "@/stores";
import { Check, X, Clock, ClipboardCheck, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";
import { KpiCard } from "@/components/common/KpiCard";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/academic/attendance")({
  head: () => ({ meta: [{ title: "Attendance — LearnNowX" }] }),
  component: AttendancePage,
});

type Mark = "P" | "A" | "L" | "ML";
const MARKS: Mark[] = ["P", "A", "L", "ML"];
const markStyle: Record<Mark, string> = {
  P: "bg-lnx-green-500 text-white border-lnx-green-500",
  A: "bg-lnx-red-500 text-white border-lnx-red-500",
  L: "bg-lnx-amber-500 text-white border-lnx-amber-500",
  ML: "bg-lnx-navy-800 text-white border-lnx-navy-800",
};

function AttendancePage() {
  const sections = useAcademicStore(s => s.sections);
  const subjects = useAcademicStore(s => s.subjects);
  const saveAttendance = useAcademicStore(s => s.saveAttendance);
  const attendance = useAcademicStore(s => s.attendance);
  const users = useUsersStore(s => s.users);

  const [secId, setSecId] = useState("CSE-A1");
  const [subId, setSubId] = useState("SUB_DBMS");
  const students = useMemo(() => users.filter(u => u.role === "student" && u.sectionId === secId), [users, secId]);
  const today = new Date().toISOString().slice(0, 10);
  const [marks, setMarks] = useState<Record<string, Mark>>(() => Object.fromEntries(students.map(s => [s.id, "P" as Mark])));

  const counts = MARKS.reduce((acc, m) => ({ ...acc, [m]: Object.values(marks).filter(v => v === m).length }), {} as Record<Mark, number>);

  const handleSave = () => {
    saveAttendance({
      id: `att_${today}_${subId}_manual`, sectionId: secId, subjectId: subId,
      facultyId: "u_fac_anjali", date: today, slot: 1, marks, submittedAt: new Date().toISOString(),
    });
    toast.success("Attendance saved", { description: `${Object.keys(marks).length} students marked` });
  };

  const recent = attendance.filter(a => a.sectionId === secId).slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle={`Mark for ${secId} — ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}`}
        action={<Button onClick={handleSave}><Save className="h-4 w-4 mr-2" />Save Attendance</Button>}
        filters={
          <div className="flex gap-3">
            <Select value={secId} onValueChange={setSecId}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={subId} onValueChange={setSubId}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.code} · {s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        }
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Present" value={counts.P} icon={Check} tone="green" />
        <KpiCard label="Absent" value={counts.A} icon={X} tone="red" />
        <KpiCard label="Leave" value={counts.L} icon={Clock} tone="amber" />
        <KpiCard label="Medical" value={counts.ML} icon={ClipboardCheck} />
      </div>
      <Card className="p-0 mb-6">
        <div className="divide-y">
          {students.map(s => (
            <div key={s.id} className="flex items-center gap-3 p-3">
              <Avatar firstName={s.firstName} lastName={s.lastName} color={s.avatarColor} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.firstName} {s.lastName}</p>
                <p className="text-xs text-muted-foreground">{s.rollNo}</p>
              </div>
              <div className="flex gap-1">
                {MARKS.map(m => (
                  <button key={m} onClick={() => setMarks(prev => ({ ...prev, [s.id]: m }))}
                    className={cn("h-8 w-9 rounded-md border text-xs font-semibold transition", marks[s.id] === m ? markStyle[m] : "border-border text-muted-foreground hover:border-foreground")}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <h3 className="text-sm font-semibold mb-3">Recent submissions for {secId}</h3>
      <Card className="p-0">
        <div className="divide-y">
          {recent.map(a => {
            const sub = subjects.find(s => s.id === a.subjectId);
            const p = Object.values(a.marks).filter(v => v === "P").length;
            const total = Object.values(a.marks).length;
            return (
              <div key={a.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium">{sub?.code} · {sub?.name}</p>
                  <p className="text-xs text-muted-foreground">{a.date} · Slot {a.slot}</p>
                </div>
                <Badge variant="secondary">{p}/{total} present ({Math.round(p/total*100)}%)</Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
