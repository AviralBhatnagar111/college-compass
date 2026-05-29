import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, Flag } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/placement/ai-assessments/take")({
  head: () => ({ meta: [{ title: "Take Assessment — LearnNowX" }] }),
  component: TakeMcq,
});

const QUESTIONS = [
  { q: "What is the time complexity of inserting into a balanced BST?", opts: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], ans: 1 },
  { q: "Which normal form removes transitive dependencies?", opts: ["1NF", "2NF", "3NF", "BCNF"], ans: 2 },
  { q: "Process vs thread — which is true?", opts: ["Threads have separate address spaces", "Processes share memory by default", "Threads share the parent's address space", "Processes are lighter than threads"], ans: 2 },
  { q: "TCP guarantees:", opts: ["In-order delivery only", "Reliable + in-order delivery", "Lowest latency", "Multicast"], ans: 1 },
  { q: "Which sorting is in-place and unstable?", opts: ["Merge sort", "Quick sort", "Bubble sort", "Counting sort"], ans: 1 },
  { q: "ACID — what does 'I' stand for?", opts: ["Indexing", "Isolation", "Integrity", "Inheritance"], ans: 1 },
  { q: "HTTP status 429 means:", opts: ["Server error", "Not found", "Too many requests", "Unauthorized"], ans: 2 },
  { q: "Big-O of binary search on sorted array of n:", opts: ["O(n)", "O(log n)", "O(√n)", "O(1)"], ans: 1 },
];

function TakeMcq() {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [seconds, setSeconds] = useState(45 * 60);

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const cur = QUESTIONS[i];
  const answered = Object.keys(answers).length;
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const submit = () => {
    const score = Object.entries(answers).filter(([qi, ai]) => QUESTIONS[+qi].ans === ai).length;
    toast.success(`Submitted • Score ${score}/${QUESTIONS.length}`, { description: "Result will reflect in your placement dashboard." });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Button asChild variant="ghost" size="sm"><Link to="/placement/ai-assessments"><ArrowLeft className="h-4 w-4 mr-1" />Exit</Link></Button>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />{mm}:{ss}</Badge>
          <Badge variant="outline">{answered}/{QUESTIONS.length} answered</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,260px] gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Question {i+1} of {QUESTIONS.length}</p>
            <button onClick={() => setFlagged(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; })}
              className={cn("text-xs flex items-center gap-1", flagged.has(i) ? "text-lnx-amber-500" : "text-muted-foreground")}>
              <Flag className="h-3 w-3" />{flagged.has(i) ? "Flagged" : "Flag for review"}
            </button>
          </div>
          <h2 className="text-lg font-semibold text-lnx-navy-800 mb-4">{cur.q}</h2>
          <div className="space-y-2">
            {cur.opts.map((opt, oi) => (
              <button key={oi} onClick={() => setAnswers(a => ({ ...a, [i]: oi }))}
                className={cn("w-full text-left p-3 rounded-md border transition flex items-center gap-3",
                  answers[i] === oi ? "border-lnx-teal-500 bg-lnx-teal-500/5" : "border-border hover:border-foreground/30")}>
                <div className={cn("h-6 w-6 rounded-full border grid place-items-center text-xs font-semibold",
                  answers[i] === oi ? "border-lnx-teal-500 bg-lnx-teal-500 text-white" : "border-border")}>
                  {String.fromCharCode(65 + oi)}
                </div>
                <span className="text-sm">{opt}</span>
              </button>
            ))}
          </div>
          <Progress value={(i + 1) / QUESTIONS.length * 100} className="mt-6 h-1" />
          <div className="mt-4 flex justify-between">
            <Button variant="outline" disabled={i === 0} onClick={() => setI(i - 1)}><ArrowLeft className="h-4 w-4 mr-1" />Previous</Button>
            {i < QUESTIONS.length - 1
              ? <Button onClick={() => setI(i + 1)}>Next<ArrowRight className="h-4 w-4 ml-1" /></Button>
              : <Button onClick={submit} className="bg-lnx-green-500 hover:bg-lnx-green-500/90"><CheckCircle2 className="h-4 w-4 mr-1" />Submit</Button>}
          </div>
        </Card>

        <Card className="p-4 h-fit">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Question Map</h3>
          <div className="grid grid-cols-5 gap-2">
            {QUESTIONS.map((_, qi) => (
              <button key={qi} onClick={() => setI(qi)}
                className={cn("h-9 rounded-md text-xs font-semibold border transition",
                  qi === i && "ring-2 ring-lnx-teal-500",
                  flagged.has(qi) && "border-lnx-amber-500",
                  answers[qi] !== undefined ? "bg-lnx-teal-500 text-white border-lnx-teal-500" : "bg-background")}>
                {qi + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-lnx-teal-500" />Answered</div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded border border-lnx-amber-500" />Flagged</div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded border" />Not visited</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
