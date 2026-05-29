import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePlacementStore, useUsersStore } from "@/stores";
import { ArrowLeft, Calendar, IndianRupee, GraduationCap, Building2 } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";

export const Route = createFileRoute("/_app/placement/drives/$id")({
  head: () => ({ meta: [{ title: "Drive Detail — LearnNowX" }] }),
  component: DriveDetail,
});

function DriveDetail() {
  const { id } = Route.useParams();
  const drives = usePlacementStore(s => s.drives);
  const companies = usePlacementStore(s => s.companies);
  const mcq = usePlacementStore(s => s.mcq);
  const ai = usePlacementStore(s => s.ai);
  const users = useUsersStore(s => s.users);

  const drive = drives.find(d => d.id === id);
  if (!drive) return <p className="p-6">Drive not found.</p>;
  const company = companies.find(c => c.id === drive.companyId);
  const stuById = (sid: string) => users.find(u => u.id === sid);

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3"><Link to="/placement/drives"><ArrowLeft className="h-4 w-4 mr-1" />All Drives</Link></Button>
      <PageHeader
        title={`${company?.name} — ${drive.role}`}
        subtitle={`${drive.package} · ${drive.branches.join(", ")} · CGPA ≥ ${drive.cgpaCutoff}`}
        action={<Badge variant="secondary" className="text-sm">{drive.status}</Badge>}
      />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4"><Building2 className="h-4 w-4 text-lnx-teal-500" /><p className="text-xs text-muted-foreground mt-2">Company Tier</p><p className="text-lg font-semibold">{company?.tier}</p></Card>
        <Card className="p-4"><IndianRupee className="h-4 w-4 text-lnx-amber-500" /><p className="text-xs text-muted-foreground mt-2">Package</p><p className="text-lg font-semibold">{drive.package}</p></Card>
        <Card className="p-4"><Calendar className="h-4 w-4 text-lnx-navy-800" /><p className="text-xs text-muted-foreground mt-2">Window</p><p className="text-xs">{new Date(drive.startDate).toLocaleDateString()} → {new Date(drive.endDate).toLocaleDateString()}</p></Card>
        <Card className="p-4"><GraduationCap className="h-4 w-4 text-lnx-green-500" /><p className="text-xs text-muted-foreground mt-2">Eligibility</p><p className="text-xs">{drive.backlogsAllowed ? "Backlogs allowed" : "No backlogs"}</p></Card>
      </div>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applicants">Applicants ({drive.appliedIds.length})</TabsTrigger>
          <TabsTrigger value="shortlist">Shortlist ({drive.shortlistedIds.length})</TabsTrigger>
          <TabsTrigger value="mcq">MCQ ({mcq.filter(m=>m.driveId===id).length})</TabsTrigger>
          <TabsTrigger value="ai">AI Interview ({ai.filter(a=>a.driveId===id).length})</TabsTrigger>
          <TabsTrigger value="selected">Selected ({drive.selectedIds.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Funnel</h3>
            <div className="space-y-2">
              {[
                { label: "Applied", n: drive.appliedIds.length },
                { label: "Shortlisted", n: drive.shortlistedIds.length },
                { label: "MCQ attempted", n: mcq.filter(m => m.driveId === id).length },
                { label: "AI interview", n: ai.filter(a => a.driveId === id).length },
                { label: "Selected", n: drive.selectedIds.length },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3">
                  <div className="w-32 text-xs text-muted-foreground">{row.label}</div>
                  <div className="flex-1 h-7 bg-muted rounded-md overflow-hidden">
                    <div className="h-full bg-lnx-teal-500" style={{ width: `${Math.min(100, row.n / Math.max(1, drive.appliedIds.length) * 100)}%` }} />
                  </div>
                  <div className="w-12 text-right text-sm font-semibold">{row.n}</div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {(["applicants","shortlist","selected"] as const).map(tab => {
          const ids = tab === "applicants" ? drive.appliedIds : tab === "shortlist" ? drive.shortlistedIds : drive.selectedIds;
          return (
            <TabsContent key={tab} value={tab} className="mt-4">
              <Card className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Roll No</TableHead><TableHead>Branch</TableHead><TableHead>CGPA</TableHead><TableHead>Backlogs</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {ids.map(sid => {
                      const s = stuById(sid); if (!s) return null;
                      return (
                        <TableRow key={sid}>
                          <TableCell><div className="flex items-center gap-2"><Avatar firstName={s.firstName} lastName={s.lastName} color={s.avatarColor} size="sm" /><span className="font-medium">{s.firstName} {s.lastName}</span></div></TableCell>
                          <TableCell className="font-mono text-xs">{s.rollNo}</TableCell>
                          <TableCell>{s.sectionId}</TableCell>
                          <TableCell><Badge variant="secondary">{s.cgpa?.toFixed(2)}</Badge></TableCell>
                          <TableCell>{s.backlogs ?? 0}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          );
        })}

        <TabsContent value="mcq" className="mt-4">
          <Card className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Score</TableHead><TableHead>%</TableHead><TableHead>Attempted</TableHead></TableRow></TableHeader>
              <TableBody>
                {mcq.filter(m => m.driveId === id).map(m => {
                  const s = stuById(m.studentId);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{s?.firstName} {s?.lastName}</TableCell>
                      <TableCell>{m.score}/{m.total}</TableCell>
                      <TableCell><Badge variant="secondary">{Math.round(m.score/m.total*100)}%</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(m.attemptedAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-4">
          <Card className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Score</TableHead><TableHead>Duration</TableHead><TableHead>Language</TableHead></TableRow></TableHeader>
              <TableBody>
                {ai.filter(a => a.driveId === id).map(a => {
                  const s = stuById(a.studentId);
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{s?.firstName} {s?.lastName}</TableCell>
                      <TableCell><Badge variant="secondary" className={a.score>=75?"bg-lnx-green-500/10 text-lnx-green-500":a.score>=60?"bg-lnx-amber-500/10 text-lnx-amber-500":"bg-lnx-red-500/10 text-lnx-red-500"}>{a.score}/100</Badge></TableCell>
                      <TableCell>{a.durationMins} min</TableCell>
                      <TableCell>{a.language}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
