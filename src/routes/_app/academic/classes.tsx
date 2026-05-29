import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAcademicStore, useUsersStore } from "@/stores";
import { Plus, Users, MapPin, DoorOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_app/academic/classes")({
  head: () => ({ meta: [{ title: "Classes & Rooms — LearnNowX" }] }),
  component: ClassesPage,
});

function ClassesPage() {
  const sections = useAcademicStore(s => s.sections);
  const programs = useAcademicStore(s => s.programs);
  const rooms = useAcademicStore(s => s.rooms);
  const users = useUsersStore(s => s.users);

  return (
    <div>
      <PageHeader title="Classes & Rooms" subtitle="Sections, batches and physical spaces" action={<Button><Plus className="h-4 w-4 mr-2" />Add</Button>} />
      <Tabs defaultValue="sections">
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
                    <TableRow key={sec.id}>
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
            {rooms.map(r => (
              <Card key={r.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{r.type}</p>
                    <h3 className="mt-1 text-lg font-semibold text-lnx-navy-800">{r.name}</h3>
                  </div>
                  <Badge variant="outline"><Users className="h-3 w-3 mr-1" />{r.capacity}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />Main Campus
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
