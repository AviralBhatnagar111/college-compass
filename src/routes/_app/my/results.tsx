import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUsersStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { GradeCard } from "@/components/exams/GradeCard";
import { Download, Award, BookOpen } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/my/results")({
  head: () => ({ meta: [{ title: "My Results — LearnNowX" }] }),
  component: MyResultsPage,
});

const SEMESTER_RESULTS = [
  { sem: 5, name: "Semester 5 — Mid Sem 2026", sgpa: 8.4, status: "published",
    subjects: [
      { code: "CS301", name: "Database Management Systems", credits: 4, grade: "A", points: 9 },
      { code: "CS302", name: "Operating Systems", credits: 4, grade: "A+", points: 10 },
      { code: "MA301", name: "Mathematics III", credits: 3, grade: "B+", points: 7 },
      { code: "CS303", name: "AI & Machine Learning", credits: 4, grade: "A", points: 9 },
      { code: "CS304", name: "Computer Networks", credits: 3, grade: "B+", points: 7 },
    ]},
  { sem: 4, name: "Semester 4 — End Sem 2025", sgpa: 7.8, status: "published",
    subjects: [
      { code: "CS201", name: "Data Structures", credits: 4, grade: "A", points: 9 },
      { code: "MA201", name: "Mathematics II", credits: 3, grade: "B", points: 6 },
      { code: "CS202", name: "Digital Logic Design", credits: 4, grade: "A", points: 9 },
    ]},
];

function MyResultsPage() {
  const { user } = useAccess();
  const studentId = user?.role === "parent" ? user.childId : user?.id;
  const student = useUsersStore(s => s.users.find(u => u.id === studentId));
  const [openSem, setOpenSem] = useState<number | null>(null);

  if (!student) return null;
  const currentSem = SEMESTER_RESULTS.find(r => r.sem === openSem);

  return (
    <div>
      <PageHeader title="My Results" subtitle={`CGPA ${student.cgpa ?? "—"} · Backlogs ${student.backlogs ?? 0}`} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {SEMESTER_RESULTS.map(r => (
          <Card key={r.sem} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lnx-navy-800">{r.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">SGPA <span className="font-semibold text-lnx-teal-500">{r.sgpa}</span> · {r.subjects.length} subjects</p>
              </div>
              <Badge className="bg-lnx-green-500/15 text-lnx-green-500">Published</Badge>
            </div>
            <div className="space-y-1 text-xs">
              {r.subjects.slice(0, 3).map(s => (
                <div key={s.code} className="flex justify-between"><span className="text-muted-foreground">{s.code}</span><span className="font-medium">{s.grade}</span></div>
              ))}
              {r.subjects.length > 3 && <p className="text-[10px] text-muted-foreground">+{r.subjects.length - 3} more</p>}
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setOpenSem(r.sem)}><Award className="h-3 w-3 mr-1" />View Grade Card</Button>
              <Button variant="ghost" size="sm" onClick={() => setOpenSem(r.sem)}><Download className="h-3 w-3 mr-1" />PDF</Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-5">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-4 w-4 text-lnx-teal-500" />
          <h3 className="text-sm font-semibold text-lnx-navy-800">DigiLocker / NAD</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Your verified grade cards are available in DigiLocker via National Academic Depository.</p>
        <Link to="/profile" className="text-xs text-lnx-teal-500 hover:underline">Manage DigiLocker connection →</Link>
      </Card>

      <Dialog open={openSem !== null} onOpenChange={v => { if (!v) setOpenSem(null); }}>
        <DialogContent className="max-w-3xl p-0">
          {currentSem && <GradeCard student={student} sem={currentSem} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
