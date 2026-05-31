import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { INSTITUTION } from "@/data/seed";

interface Subject { code: string; name: string; credits: number; grade: string; points: number; }
interface SemResult { sem: number; name: string; sgpa: number; subjects: Subject[]; }

export function GradeCard({ student, sem }: { student: User; sem: SemResult }) {
  const totalCredits = sem.subjects.reduce((s, x) => s + x.credits, 0);
  const totalPoints = sem.subjects.reduce((s, x) => s + x.credits * x.points, 0);
  return (
    <div className="bg-white text-lnx-navy-800 print:bg-white">
      <div className="flex items-center justify-between border-b-4 border-lnx-navy-800 px-6 py-4 print:px-8">
        <div>
          <h2 className="text-lg font-bold">{INSTITUTION.name}</h2>
          <p className="text-xs text-muted-foreground">{INSTITUTION.type} · {INSTITUTION.city} · Estd. {INSTITUTION.founded}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Grade Card</p>
          <p className="text-xs font-mono">GC/{sem.sem}/{student.rollNo}</p>
        </div>
      </div>

      <div className="p-6 print:p-8 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <p><span className="text-muted-foreground">Name:</span> <span className="font-semibold">{student.firstName} {student.lastName}</span></p>
            <p><span className="text-muted-foreground">Roll No:</span> <span className="font-mono">{student.rollNo}</span></p>
            <p><span className="text-muted-foreground">Program:</span> B.Tech {student.department}</p>
          </div>
          <div className="space-y-1">
            <p><span className="text-muted-foreground">Semester:</span> {sem.sem}</p>
            <p><span className="text-muted-foreground">Examination:</span> {sem.name}</p>
            <p><span className="text-muted-foreground">Issued:</span> {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
          </div>
        </div>

        <table className="w-full text-xs border">
          <thead className="bg-muted/40"><tr className="text-left">
            <th className="p-2">Code</th><th className="p-2">Subject</th><th className="p-2 text-center">Credits</th><th className="p-2 text-center">Grade</th><th className="p-2 text-center">Points</th>
          </tr></thead>
          <tbody>
            {sem.subjects.map(s => (
              <tr key={s.code} className="border-t">
                <td className="p-2 font-mono">{s.code}</td>
                <td className="p-2">{s.name}</td>
                <td className="p-2 text-center">{s.credits}</td>
                <td className="p-2 text-center font-semibold">{s.grade}</td>
                <td className="p-2 text-center">{s.points}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-muted/20"><tr className="border-t font-semibold">
            <td className="p-2" colSpan={2}>Total</td>
            <td className="p-2 text-center">{totalCredits}</td>
            <td className="p-2 text-center">SGPA</td>
            <td className="p-2 text-center text-lnx-teal-500">{sem.sgpa.toFixed(2)}</td>
          </tr></tfoot>
        </table>

        <div className="grid grid-cols-3 gap-4 text-[10px] text-muted-foreground pt-8 border-t">
          <div><p className="border-t border-dashed pt-1 mt-6">Controller of Examinations</p></div>
          <div className="text-center">
            <p className="text-[9px]">Verified via NAD</p>
            <div className="mx-auto h-12 w-12 border-2 border-lnx-navy-800 mt-1 grid grid-cols-4 grid-rows-4 gap-px p-1">
              {Array.from({ length: 16 }).map((_, i) => <div key={i} className={i % 3 === 0 ? "bg-lnx-navy-800" : ""} />)}
            </div>
          </div>
          <div className="text-right"><p className="border-t border-dashed pt-1 mt-6">Registrar</p></div>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t bg-muted/30 p-3 print:hidden">
        <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-3 w-3 mr-1" />Print / PDF</Button>
      </div>
    </div>
  );
}
