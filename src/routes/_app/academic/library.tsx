import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAccessStore } from "@/stores";
import { useAccess } from "@/lib/access";
import { BookOpen, Search, IndianRupee, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/academic/library")({
  head: () => ({ meta: [{ title: "Library — LearnNowX" }] }),
  component: LibraryPage,
});

interface Book { id: string; title: string; author: string; isbn: string; category: string; copies: number; available: number; }
interface Loan { id: string; bookId: string; bookTitle: string; member: string; issuedAt: string; dueAt: string; status: "issued" | "returned" | "overdue"; }

const BOOKS: Book[] = [
  { id: "B1", title: "Database System Concepts", author: "Silberschatz", isbn: "978-0078022159", category: "CSE", copies: 12, available: 4 },
  { id: "B2", title: "Operating System Concepts", author: "Galvin", isbn: "978-1118063330", category: "CSE", copies: 10, available: 3 },
  { id: "B3", title: "Computer Networks", author: "Tanenbaum", isbn: "978-0132126953", category: "CSE", copies: 8, available: 5 },
  { id: "B4", title: "Engineering Mechanics", author: "Hibbeler", isbn: "978-0133918922", category: "ME", copies: 9, available: 6 },
  { id: "B5", title: "Structural Analysis", author: "Hibbeler", isbn: "978-0134610672", category: "CIVIL", copies: 7, available: 4 },
  { id: "B6", title: "Microelectronic Circuits", author: "Sedra/Smith", isbn: "978-0199339136", category: "ECE", copies: 8, available: 2 },
  { id: "B7", title: "Molecular Biology of the Cell", author: "Alberts", isbn: "978-0815345244", category: "BIOTECH", copies: 6, available: 4 },
  { id: "B8", title: "Principles of Marketing", author: "Kotler", isbn: "978-0134492513", category: "MBA", copies: 10, available: 7 },
];

const LOANS: Loan[] = [
  { id: "L1", bookId: "B1", bookTitle: "Database System Concepts", member: "Vikas Chauhan (23BCSE001)", issuedAt: "2026-06-15", dueAt: "2026-06-29", status: "issued" },
  { id: "L2", bookId: "B2", bookTitle: "Operating System Concepts", member: "Priya Sharma (23BCSE008)", issuedAt: "2026-06-10", dueAt: "2026-06-24", status: "overdue" },
  { id: "L3", bookId: "B6", bookTitle: "Microelectronic Circuits", member: "Karan Iyer (23BECE004)", issuedAt: "2026-06-18", dueAt: "2026-07-02", status: "issued" },
];

function LibraryPage() {
  const [books, setBooks] = useState(BOOKS);
  const [loans, setLoans] = useState(LOANS);
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<Book | null>(null);
  const addAudit = useAccessStore(s => s.addAudit);
  const { user } = useAccess();

  const filtered = useMemo(() => books.filter(b =>
    b.title.toLowerCase().includes(q.toLowerCase()) || b.author.toLowerCase().includes(q.toLowerCase()) || b.isbn.includes(q)
  ), [books, q]);

  const issue = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book || book.available <= 0) return toast.error("No copies available");
    setBooks(p => p.map(b => b.id === bookId ? { ...b, available: b.available - 1 } : b));
    const due = new Date(); due.setDate(due.getDate() + 14);
    const l: Loan = { id: `L_${Date.now()}`, bookId, bookTitle: book.title, member: "New member", issuedAt: new Date().toISOString().slice(0, 10), dueAt: due.toISOString().slice(0, 10), status: "issued" };
    setLoans(p => [l, ...p]);
    addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? "u_clerk_1", module: "Library", action: `Issued "${book.title}"` });
    toast.success("Issued", { description: `Due ${l.dueAt}` });
  };
  const returnBook = (loanId: string) => {
    setLoans(p => p.map(l => l.id === loanId ? { ...l, status: "returned" } : l));
    const loan = loans.find(l => l.id === loanId);
    if (loan) {
      setBooks(p => p.map(b => b.id === loan.bookId ? { ...b, available: b.available + 1 } : b));
      addAudit({ id: `aud_${Date.now().toString(36)}`, at: new Date().toISOString(), actorId: user?.id ?? "u_clerk_1", module: "Library", action: `Returned "${loan.bookTitle}"` });
    }
    toast.success("Returned");
  };

  const totalCopies = books.reduce((s, b) => s + b.copies, 0);
  const overdue = loans.filter(l => l.status === "overdue").length;
  const fines = overdue * 50;

  return (
    <div>
      <PageHeader title="Library" subtitle="Catalogue, circulation, members and fines" action={<Button><Plus className="h-4 w-4 mr-2" />Add book</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Titles</div><div className="mt-1 text-2xl font-semibold tabular">{books.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Total copies</div><div className="mt-1 text-2xl font-semibold tabular">{totalCopies}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Active loans</div><div className="mt-1 text-2xl font-semibold tabular">{loans.filter(l => l.status !== "returned").length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Outstanding fines</div><div className="mt-1 text-2xl font-semibold tabular text-lnx-amber-500"><IndianRupee className="h-4 w-4 inline" />{fines}</div></Card>
      </div>

      <Tabs defaultValue="catalogue">
        <TabsList><TabsTrigger value="catalogue">Catalogue</TabsTrigger><TabsTrigger value="circulation">Circulation</TabsTrigger></TabsList>
        <TabsContent value="catalogue" className="mt-4">
          <div className="relative max-w-md mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by title, author or ISBN…" className="pl-9" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Author</TableHead><TableHead>Category</TableHead><TableHead>Available</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map(b => (
                  <TableRow key={b.id} className="cursor-pointer" onClick={() => setDetail(b)}>
                    <TableCell className="font-medium">{b.title}</TableCell>
                    <TableCell>{b.author}</TableCell>
                    <TableCell><Badge variant="outline">{b.category}</Badge></TableCell>
                    <TableCell className="tabular">{b.available}/{b.copies}</TableCell>
                    <TableCell><Button size="sm" onClick={e => { e.stopPropagation(); issue(b.id); }} disabled={b.available === 0}>Issue</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="circulation" className="mt-4">
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Book</TableHead><TableHead>Member</TableHead><TableHead>Issued</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {loans.map(l => (
                  <TableRow key={l.id}>
                    <TableCell>{l.bookTitle}</TableCell>
                    <TableCell className="text-sm">{l.member}</TableCell>
                    <TableCell className="text-xs">{l.issuedAt}</TableCell>
                    <TableCell className="text-xs">{l.dueAt}</TableCell>
                    <TableCell><Badge variant={l.status === "overdue" ? "destructive" : "outline"}>{l.status}</Badge></TableCell>
                    <TableCell>{l.status !== "returned" && <Button size="sm" variant="outline" onClick={() => returnBook(l.id)}>Return</Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={!!detail} onOpenChange={v => !v && setDetail(null)}>
        <SheetContent>
          {detail && (
            <>
              <SheetHeader><SheetTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-lnx-teal-500" />{detail.title}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-2 text-sm">
                <p><span className="text-muted-foreground">Author:</span> {detail.author}</p>
                <p><span className="text-muted-foreground">ISBN:</span> {detail.isbn}</p>
                <p><span className="text-muted-foreground">Category:</span> {detail.category}</p>
                <p><span className="text-muted-foreground">Copies:</span> {detail.available} of {detail.copies} available</p>
              </div>
              <Button className="mt-6 w-full" onClick={() => { issue(detail.id); setDetail(null); }} disabled={detail.available === 0}>Issue copy</Button>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
