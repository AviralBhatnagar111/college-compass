import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bus, Plus, IndianRupee } from "lucide-react";

export const Route = createFileRoute("/_app/admin/transport")({
  head: () => ({ meta: [{ title: "Transport — LearnNowX" }] }),
  component: TransportPage,
});

interface Route { id: string; name: string; stops: number; distance: string; vehicle: string; driver: string; students: number; fee: number; }
const ROUTES: Route[] = [
  { id: "R1", name: "Route A — Hitech City ↔ Campus", stops: 8, distance: "18 km", vehicle: "TS-09-AB-1234", driver: "Mahesh Kumar", students: 32, fee: 18000 },
  { id: "R2", name: "Route B — Kondapur ↔ Campus", stops: 6, distance: "14 km", vehicle: "TS-09-AB-1235", driver: "Suresh Reddy", students: 28, fee: 16000 },
  { id: "R3", name: "Route C — Gachibowli ↔ Campus", stops: 10, distance: "22 km", vehicle: "TS-09-AB-1236", driver: "Ramu Goud", students: 35, fee: 20000 },
  { id: "R4", name: "Route D — Secunderabad ↔ Campus", stops: 12, distance: "28 km", vehicle: "TS-09-AB-1237", driver: "Vinod Naidu", students: 24, fee: 22000 },
];

function TransportPage() {
  const [open, setOpen] = useState<Route | null>(null);
  const totalStudents = ROUTES.reduce((s, r) => s + r.students, 0);
  const monthlyRevenue = ROUTES.reduce((s, r) => s + r.students * r.fee, 0) / 12;

  return (
    <div>
      <PageHeader title="Transport" subtitle="Routes, vehicles, drivers and student allocation" action={<Button><Plus className="h-4 w-4 mr-2" />New route</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Routes</div><div className="mt-1 text-2xl font-semibold tabular">{ROUTES.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Vehicles</div><div className="mt-1 text-2xl font-semibold tabular">{ROUTES.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Students served</div><div className="mt-1 text-2xl font-semibold tabular text-lnx-teal-500">{totalStudents}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Monthly revenue</div><div className="mt-1 text-2xl font-semibold tabular"><IndianRupee className="h-4 w-4 inline" />{Math.round(monthlyRevenue).toLocaleString("en-IN")}</div></Card>
      </div>

      <Tabs defaultValue="routes">
        <TabsList><TabsTrigger value="routes">Routes</TabsTrigger><TabsTrigger value="vehicles">Vehicles</TabsTrigger><TabsTrigger value="drivers">Drivers</TabsTrigger></TabsList>
        <TabsContent value="routes" className="mt-4">
          <Card><Table>
            <TableHeader><TableRow><TableHead>Route</TableHead><TableHead>Stops</TableHead><TableHead>Distance</TableHead><TableHead>Students</TableHead><TableHead>Annual fee</TableHead></TableRow></TableHeader>
            <TableBody>{ROUTES.map(r => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => setOpen(r)}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="tabular">{r.stops}</TableCell>
                <TableCell>{r.distance}</TableCell>
                <TableCell className="tabular">{r.students}</TableCell>
                <TableCell className="tabular"><IndianRupee className="h-3 w-3 inline" />{r.fee.toLocaleString("en-IN")}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table></Card>
        </TabsContent>
        <TabsContent value="vehicles" className="mt-4">
          <Card><Table>
            <TableHeader><TableRow><TableHead>Vehicle</TableHead><TableHead>Route</TableHead><TableHead>Driver</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{ROUTES.map(r => <TableRow key={r.id}><TableCell>{r.vehicle}</TableCell><TableCell>{r.name.split("—")[0].trim()}</TableCell><TableCell>{r.driver}</TableCell><TableCell><Badge variant="outline" className="bg-lnx-green-500/10 text-lnx-green-500">Active</Badge></TableCell></TableRow>)}</TableBody>
          </Table></Card>
        </TabsContent>
        <TabsContent value="drivers" className="mt-4">
          <Card><Table>
            <TableHeader><TableRow><TableHead>Driver</TableHead><TableHead>Vehicle</TableHead><TableHead>License</TableHead><TableHead>Contact</TableHead></TableRow></TableHeader>
            <TableBody>{ROUTES.map((r, i) => <TableRow key={r.id}><TableCell>{r.driver}</TableCell><TableCell>{r.vehicle}</TableCell><TableCell>DL-TS-2018-{1000 + i}</TableCell><TableCell>+91 98480 {String(10000 + i*7).slice(0,5)}</TableCell></TableRow>)}</TableBody>
          </Table></Card>
        </TabsContent>
      </Tabs>

      <Sheet open={!!open} onOpenChange={v => !v && setOpen(null)}>
        <SheetContent>
          {open && (<>
            <SheetHeader><SheetTitle className="flex items-center gap-2"><Bus className="h-5 w-5 text-lnx-teal-500" />{open.name}</SheetTitle></SheetHeader>
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Distance:</span> {open.distance}</p>
              <p><span className="text-muted-foreground">Stops:</span> {open.stops}</p>
              <p><span className="text-muted-foreground">Vehicle:</span> {open.vehicle}</p>
              <p><span className="text-muted-foreground">Driver:</span> {open.driver}</p>
              <p><span className="text-muted-foreground">Students:</span> {open.students}</p>
              <p><span className="text-muted-foreground">Annual fee:</span> ₹{open.fee.toLocaleString("en-IN")}</p>
            </div>
          </>)}
        </SheetContent>
      </Sheet>
    </div>
  );
}
