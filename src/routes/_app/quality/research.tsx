import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FileText, IndianRupee, Plus, Award } from "lucide-react";

export const Route = createFileRoute("/_app/quality/research")({
  head: () => ({ meta: [{ title: "Research — LearnNowX" }] }),
  component: ResearchPage,
});

interface Pub { id: string; title: string; faculty: string; venue: string; year: number; type: "Journal" | "Conference" | "Book Chapter"; citations: number; }
interface Project { id: string; title: string; pi: string; sponsor: string; amount: number; start: string; end: string; status: "Ongoing" | "Completed"; }
interface Patent { id: string; title: string; inventors: string; status: "Filed" | "Published" | "Granted"; date: string; }

const PUBS: Pub[] = [
  { id: "P1", title: "Federated Learning for Edge IoT", faculty: "Aarti Sharma", venue: "IEEE TPDS", year: 2025, type: "Journal", citations: 18 },
  { id: "P2", title: "Low-Power VLSI for Wearables", faculty: "Kavita Bhatia", venue: "VLSID 2025", year: 2025, type: "Conference", citations: 7 },
  { id: "P3", title: "Sustainable Concrete Mix Design", faculty: "Geetha Pillai", venue: "Construction & Building Materials", year: 2024, type: "Journal", citations: 24 },
  { id: "P4", title: "CRISPR Applications in Crop Yield", faculty: "Sneha Patil", venue: "Plant Biotechnology J.", year: 2024, type: "Journal", citations: 31 },
  { id: "P5", title: "Heat Transfer in Hybrid Engines", faculty: "Manish Agarwal", venue: "Applied Thermal Eng.", year: 2025, type: "Journal", citations: 9 },
];

const PROJECTS: Project[] = [
  { id: "PR1", title: "AI-driven Predictive Maintenance for Manufacturing", pi: "Aarti Sharma", sponsor: "DST-SERB", amount: 4800000, start: "2024-04", end: "2027-03", status: "Ongoing" },
  { id: "PR2", title: "Smart Grid Stability with Renewables", pi: "Manoj Kulkarni", sponsor: "MNRE", amount: 3200000, start: "2024-09", end: "2026-08", status: "Ongoing" },
  { id: "PR3", title: "Biofuel from Algae", pi: "Sneha Patil", sponsor: "DBT", amount: 2400000, start: "2023-06", end: "2025-05", status: "Completed" },
];

const PATENTS: Patent[] = [
  { id: "PT1", title: "Adaptive Throttling for Embedded SoC", inventors: "Kavita Bhatia, Sandeep Rao", status: "Granted", date: "2025-02-14" },
  { id: "PT2", title: "Self-cleaning Solar Panel Coating", inventors: "Sunita Reddy", status: "Published", date: "2025-08-30" },
  { id: "PT3", title: "Wearable ECG Monitor", inventors: "Manoj Kulkarni, Pooja Joshi", status: "Filed", date: "2026-03-10" },
];

function ResearchPage() {
  const [openProj, setOpenProj] = useState<Project | null>(null);
  const totalFunding = PROJECTS.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <PageHeader title="Research" subtitle="Publications, projects, patents and grants — feeds NAAC C3, NBA, NIRF" action={<Button><Plus className="h-4 w-4 mr-2" />Add publication</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Publications</div><div className="mt-1 text-2xl font-semibold tabular">{PUBS.length}</div><Link to="/compliance/nirf" className="text-[10px] text-lnx-teal-500">Used in NIRF RPC →</Link></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Active projects</div><div className="mt-1 text-2xl font-semibold tabular">{PROJECTS.filter(p => p.status === "Ongoing").length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Patents</div><div className="mt-1 text-2xl font-semibold tabular">{PATENTS.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Total funding</div><div className="mt-1 text-2xl font-semibold tabular text-lnx-teal-500"><IndianRupee className="h-4 w-4 inline" />{(totalFunding/100000).toFixed(1)}L</div></Card>
      </div>

      <Tabs defaultValue="publications">
        <TabsList><TabsTrigger value="publications">Publications</TabsTrigger><TabsTrigger value="projects">Projects & Grants</TabsTrigger><TabsTrigger value="patents">Patents</TabsTrigger></TabsList>
        <TabsContent value="publications" className="mt-4">
          <Card><Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Faculty</TableHead><TableHead>Venue</TableHead><TableHead>Year</TableHead><TableHead>Type</TableHead><TableHead>Citations</TableHead></TableRow></TableHeader>
            <TableBody>{PUBS.map(p => (
              <TableRow key={p.id}><TableCell>{p.title}</TableCell><TableCell>{p.faculty}</TableCell><TableCell className="text-xs italic">{p.venue}</TableCell><TableCell className="tabular">{p.year}</TableCell><TableCell><Badge variant="outline">{p.type}</Badge></TableCell><TableCell className="tabular">{p.citations}</TableCell></TableRow>
            ))}</TableBody>
          </Table></Card>
        </TabsContent>
        <TabsContent value="projects" className="mt-4">
          <Card><Table>
            <TableHeader><TableRow><TableHead>Project</TableHead><TableHead>PI</TableHead><TableHead>Sponsor</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{PROJECTS.map(p => (
              <TableRow key={p.id} className="cursor-pointer" onClick={() => setOpenProj(p)}>
                <TableCell>{p.title}</TableCell>
                <TableCell>{p.pi}</TableCell>
                <TableCell>{p.sponsor}</TableCell>
                <TableCell className="tabular"><IndianRupee className="h-3 w-3 inline" />{(p.amount/100000).toFixed(1)}L</TableCell>
                <TableCell><Badge variant={p.status === "Ongoing" ? "outline" : "secondary"}>{p.status}</Badge></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table></Card>
        </TabsContent>
        <TabsContent value="patents" className="mt-4">
          <Card><Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Inventors</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>{PATENTS.map(p => (
              <TableRow key={p.id}><TableCell>{p.title}</TableCell><TableCell className="text-xs">{p.inventors}</TableCell><TableCell><Badge variant="outline">{p.status === "Granted" ? <><Award className="h-3 w-3 mr-1 inline" />Granted</> : p.status}</Badge></TableCell><TableCell className="text-xs">{p.date}</TableCell></TableRow>
            ))}</TableBody>
          </Table></Card>
        </TabsContent>
      </Tabs>

      <Sheet open={!!openProj} onOpenChange={v => !v && setOpenProj(null)}>
        <SheetContent>
          {openProj && (<>
            <SheetHeader><SheetTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-lnx-teal-500" />{openProj.title}</SheetTitle></SheetHeader>
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="text-muted-foreground">PI:</span> {openProj.pi}</p>
              <p><span className="text-muted-foreground">Sponsor:</span> {openProj.sponsor}</p>
              <p><span className="text-muted-foreground">Amount:</span> ₹{openProj.amount.toLocaleString("en-IN")}</p>
              <p><span className="text-muted-foreground">Duration:</span> {openProj.start} → {openProj.end}</p>
              <p><span className="text-muted-foreground">Status:</span> {openProj.status}</p>
            </div>
          </>)}
        </SheetContent>
      </Sheet>
    </div>
  );
}
