import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, GraduationCap, Plus } from "lucide-react";

export const Route = createFileRoute("/_app/people/alumni")({
  head: () => ({ meta: [{ title: "Alumni — LearnNowX" }] }),
  component: AlumniPage,
});

interface Alum { id: string; name: string; batch: string; program: string; employer: string; role: string; package: string; location: string; email: string; engagement: number; }

const ALUMNI: Alum[] = [
  { id: "AL1", name: "Anand Krishnan", batch: "2019-23", program: "B.Tech CSE", employer: "Microsoft", role: "SDE II", package: "₹38 LPA", location: "Hyderabad", email: "anand.k@alum.bharatedu.in", engagement: 92 },
  { id: "AL2", name: "Sneha Reddy", batch: "2019-23", program: "B.Tech CSE", employer: "Razorpay", role: "Backend Engineer", package: "₹22 LPA", location: "Bengaluru", email: "sneha.r@alum.bharatedu.in", engagement: 85 },
  { id: "AL3", name: "Vikram Iyer", batch: "2018-22", program: "B.Tech ECE", employer: "Qualcomm", role: "ASIC Engineer", package: "₹28 LPA", location: "Hyderabad", email: "vikram.i@alum.bharatedu.in", engagement: 78 },
  { id: "AL4", name: "Priya Nair", batch: "2018-22", program: "B.Tech CSE", employer: "Google", role: "SWE", package: "₹42 LPA", location: "Bengaluru", email: "priya.n@alum.bharatedu.in", engagement: 95 },
  { id: "AL5", name: "Rahul Gupta", batch: "2020-24", program: "B.Tech ME", employer: "Tata Motors", role: "Design Engineer", package: "₹9 LPA", location: "Pune", email: "rahul.g@alum.bharatedu.in", engagement: 65 },
  { id: "AL6", name: "Kavya Bose", batch: "2019-23", program: "MBA", employer: "Deloitte", role: "Consultant", package: "₹16 LPA", location: "Mumbai", email: "kavya.b@alum.bharatedu.in", engagement: 70 },
  { id: "AL7", name: "Manish Sharma", batch: "2017-21", program: "B.Tech CSE", employer: "Amazon", role: "SDE III", package: "₹52 LPA", location: "Seattle", email: "manish.s@alum.bharatedu.in", engagement: 88 },
  { id: "AL8", name: "Diya Mehta", batch: "2020-24", program: "B.Tech BIOTECH", employer: "Biocon", role: "Research Associate", package: "₹8 LPA", location: "Bengaluru", email: "diya.m@alum.bharatedu.in", engagement: 60 },
];

function AlumniPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Alum | null>(null);

  const filtered = useMemo(() => ALUMNI.filter(a =>
    [a.name, a.employer, a.program, a.location].join(" ").toLowerCase().includes(q.toLowerCase())
  ), [q]);

  const totalEng = ALUMNI.reduce((s, a) => s + a.engagement, 0) / ALUMNI.length;
  const placed = ALUMNI.filter(a => parseInt(a.package) >= 10).length;

  return (
    <div>
      <PageHeader title="Alumni Network" subtitle="Records, engagement and outcomes feeding NIRF/NAAC" action={<Button><Plus className="h-4 w-4 mr-2" />Add alumnus</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Total alumni</div><div className="mt-1 text-2xl font-semibold tabular">2,847</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Engagement</div><div className="mt-1 text-2xl font-semibold tabular text-lnx-teal-500">{Math.round(totalEng)}%</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Higher ed</div><div className="mt-1 text-2xl font-semibold tabular">412</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">≥ ₹10 LPA (shown)</div><div className="mt-1 text-2xl font-semibold tabular">{placed}/{ALUMNI.length}</div></Card>
      </div>

      <div className="relative max-w-md mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name, employer, program…" className="pl-9" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <Card><Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Batch</TableHead><TableHead>Program</TableHead><TableHead>Employer</TableHead><TableHead>Package</TableHead><TableHead>Engagement</TableHead></TableRow></TableHeader>
        <TableBody>{filtered.map(a => (
          <TableRow key={a.id} className="cursor-pointer" onClick={() => setOpen(a)}>
            <TableCell className="font-medium">{a.name}</TableCell>
            <TableCell className="text-xs">{a.batch}</TableCell>
            <TableCell><Badge variant="outline">{a.program}</Badge></TableCell>
            <TableCell>{a.employer}</TableCell>
            <TableCell className="tabular">{a.package}</TableCell>
            <TableCell><div className="flex items-center gap-2"><div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden"><div className="h-full bg-lnx-teal-500" style={{ width: `${a.engagement}%` }} /></div><span className="text-xs tabular">{a.engagement}%</span></div></TableCell>
          </TableRow>
        ))}</TableBody>
      </Table></Card>

      <Sheet open={!!open} onOpenChange={v => !v && setOpen(null)}>
        <SheetContent>
          {open && (<>
            <SheetHeader><SheetTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-lnx-teal-500" />{open.name}</SheetTitle></SheetHeader>
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Batch:</span> {open.batch}</p>
              <p><span className="text-muted-foreground">Program:</span> {open.program}</p>
              <p><span className="text-muted-foreground">Employer:</span> {open.employer}</p>
              <p><span className="text-muted-foreground">Role:</span> {open.role}</p>
              <p><span className="text-muted-foreground">Package:</span> {open.package}</p>
              <p><span className="text-muted-foreground">Location:</span> {open.location}</p>
              <p><span className="text-muted-foreground">Email:</span> {open.email}</p>
              <p><span className="text-muted-foreground">Engagement score:</span> {open.engagement}%</p>
            </div>
            <Button className="mt-6 w-full" variant="outline">Invite to mentorship program</Button>
          </>)}
        </SheetContent>
      </Sheet>
    </div>
  );
}
