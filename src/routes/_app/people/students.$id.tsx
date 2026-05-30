import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar } from "@/components/common/Avatar";
import { AttendanceChip, StatusChip } from "@/components/common/StateBadges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUsersStore, useAcademicStore, useFinanceStore, usePlacementStore } from "@/stores";
import { ArrowLeft, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { KpiCard } from "@/components/common/KpiCard";

export const Route = createFileRoute("/_app/people/students/$id")({
  head: () => ({ meta: [{ title: "Student Detail — LearnNowX" }] }),
  component: StudentDetail,
});

function StudentDetail() {
  const { id } = Route.useParams();
  const student = useUsersStore(s => s.users.find(u => u.id === id));
  const parent = useUsersStore(s => s.users.find(u => u.id === student?.parentId));
  const attendance = useAcademicStore(s => s.attendance);
  const ledger = useFinanceStore(s => s.ledger.filter(l => l.studentId === id));
  const mcq = usePlacementStore(s => s.mcq.filter(m => m.studentId === id));

  if (!student) return <div className="p-10 text-center">Student not found.</div>;

  const subjAtt = ["SUB_DBMS","SUB_OS","SUB_MATH3","SUB_AIML"].map(sub => {
    const recs = attendance.filter(a => a.sectionId === student.sectionId && a.subjectId === sub);
    const total = recs.length;
    const present = recs.filter(r => r.marks[student.id] === "P").length;
    return { sub, pct: total > 0 ? Math.round(present/total*100) : 0 };
  });
  const balance = ledger.reduce((acc, e) => acc + (e.charge ?? 0) - (e.payment ?? 0) - (e.scholarship ?? 0), 0);

  return (
    <div>
      <Button variant="ghost" size="sm" asChild className="mb-3"><Link to="/people/students"><ArrowLeft className="mr-1 h-4 w-4" />All students</Link></Button>

      <Card className="mb-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar initials={student.initials} color={student.avatarColor} size="xl" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-lnx-navy-800">{student.firstName} {student.lastName}</h1>
                <StatusChip status={student.status} />
              </div>
              <p className="text-sm text-muted-foreground">{student.rollNo} · {student.sectionId} · Batch {student.batch}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span><Mail className="inline h-3 w-3 mr-1" />{student.email}</span>
                <span><Phone className="inline h-3 w-3 mr-1" />{student.phone}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Email Parent</Button>
            <Button>Edit</Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="CGPA" value={student.cgpa?.toFixed(2) ?? "—"} tone="teal" />
        <KpiCard label="Attendance" value={`${student.attendancePct}%`} tone={student.attendancePct! >= 75 ? "green" : "amber"} />
        <KpiCard label="Backlogs" value={student.backlogs ?? 0} tone={(student.backlogs ?? 0) > 0 ? "red" : "default"} />
        <KpiCard label="Fee Balance" value={`₹${balance.toLocaleString("en-IN")}`} tone={balance > 0 ? "amber" : "green"} />
      </div>

      <Tabs defaultValue="academic">
        <TabsList><TabsTrigger value="academic">Academic</TabsTrigger><TabsTrigger value="finance">Finance</TabsTrigger><TabsTrigger value="placement">Placement</TabsTrigger><TabsTrigger value="parent">Parent</TabsTrigger><TabsTrigger value="documents">Documents</TabsTrigger></TabsList>

        <TabsContent value="academic">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">Subject-wise Attendance</h3>
            <div className="space-y-2">
              {subjAtt.map(s => (
                <div key={s.sub} className="flex items-center justify-between"><span className="text-sm">{s.sub}</span><AttendanceChip pct={s.pct} /></div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="finance">
          <Card className="p-0">
            {ledger.length === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">No fee entries yet.</div> :
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-2">Date</th><th>Head</th><th className="num">Charge</th><th className="num">Payment</th><th className="num">Balance</th></tr></thead>
                <tbody className="divide-y">{ledger.map(l => <tr key={l.id}><td className="px-4 py-2">{new Date(l.date).toLocaleDateString()}</td><td>{l.head}</td><td className="num">{l.charge ? `₹${l.charge.toLocaleString("en-IN")}` : "—"}</td><td className="num">{l.payment ? `₹${l.payment.toLocaleString("en-IN")}` : "—"}</td><td className="num">₹{l.balance.toLocaleString("en-IN")}</td></tr>)}</tbody>
              </table>
            }
          </Card>
        </TabsContent>

        <TabsContent value="placement">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">MCQ Attempts ({mcq.length})</h3>
            {mcq.length === 0 ? <p className="text-xs text-muted-foreground">No attempts yet.</p> :
              <div className="space-y-2">{mcq.map(m => <div key={m.id} className="flex items-center justify-between text-sm"><span>{m.jobProfileId}</span><Badge variant="secondary">{m.score}/{m.total}</Badge></div>)}</div>
            }
          </Card>
        </TabsContent>

        <TabsContent value="parent">
          {parent ? (
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <Avatar initials={parent.initials} color={parent.avatarColor} />
                <div><div className="font-medium">{parent.firstName} {parent.lastName}</div><div className="text-xs text-muted-foreground">{parent.email} · {parent.phone}</div></div>
              </div>
            </Card>
          ) : <Card className="p-5 text-sm text-muted-foreground">No parent linked.</Card>}
        </TabsContent>

        <TabsContent value="documents">
          <Card className="p-5 text-sm text-muted-foreground">Aadhaar, 10th/12th marksheets, transfer certificate, photo — DigiLocker integration pending.</Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
