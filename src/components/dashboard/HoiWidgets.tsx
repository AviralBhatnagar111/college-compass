// HOI dashboard widget pack — period selector, explain, export-report,
// segmented announce, retention/at-risk, deadlines calendar, assign-task.
import { useMemo, useState } from "react";
import { format, addDays, differenceInDays } from "date-fns";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, Megaphone, FileBarChart, AlertTriangle, ListChecks, Stamp } from "lucide-react";
import { useTaskStore } from "@/stores/tasks";
import { useAccessStore } from "@/stores";
import type { User } from "@/lib/types";

// ─── Period selector ─────────────────────────────────────────────────────
export type Period = "today" | "week" | "month" | "term" | "ytd";
export const PERIOD_LABEL: Record<Period, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  term: "This Term",
  ytd: "YTD",
};

export function PeriodSelector({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="inline-flex rounded-lg border bg-card p-0.5 shadow-sm">
      {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition ${
            value === p ? "bg-lnx-teal-500 text-white" : "text-muted-foreground hover:bg-accent"
          }`}
        >
          {PERIOD_LABEL[p]}
        </button>
      ))}
    </div>
  );
}

// Period multiplier helper for trend/target math
export function periodFactor(p: Period) {
  return { today: 0.06, week: 0.25, month: 1, term: 4, ytd: 6 }[p];
}

// ─── Explain dialog ──────────────────────────────────────────────────────
export interface ExplainRow { label: string; value: string; tone?: "default" | "good" | "warn" | "bad" }
export function ExplainDialog({
  open, onOpenChange, title, formula, rows, source,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  title: string; formula?: string; rows: ExplainRow[]; source: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Explain: {title}</DialogTitle>
          {formula && <DialogDescription className="font-mono text-xs">{formula}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between border-b py-1.5 text-sm last:border-0">
              <span className="text-muted-foreground">{r.label}</span>
              <span className={`tabular font-medium ${
                r.tone === "good" ? "text-lnx-green-500" :
                r.tone === "warn" ? "text-lnx-amber-500" :
                r.tone === "bad" ? "text-lnx-red-500" : "text-lnx-navy-800"
              }`}>{r.value}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">Source: {source}</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assign-as-Task dialog ───────────────────────────────────────────────
export function AssignTaskDialog({
  open, onOpenChange, defaultTitle, source, candidates, byUserId,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  defaultTitle: string; source: string;
  candidates: User[]; byUserId: string;
}) {
  const addTask = useTaskStore((s) => s.addTask);
  const addAudit = useAccessStore((s) => s.addAudit);
  const [title, setTitle] = useState(defaultTitle);
  const [assignee, setAssignee] = useState(candidates[0]?.id ?? "");
  const [due, setDue] = useState(format(addDays(new Date(), 3), "yyyy-MM-dd"));
  const [note, setNote] = useState("");

  const submit = () => {
    const assignedUser = candidates.find((c) => c.id === assignee);
    if (!assignedUser) return;
    const task = addTask({
      title, assigneeId: assignee,
      assigneeName: `${assignedUser.firstName} ${assignedUser.lastName}`,
      createdBy: byUserId, dueAt: new Date(due).toISOString(), source, note,
    });
    addAudit({
      id: `aud_${Date.now().toString(36)}`,
      at: new Date().toISOString(),
      actorId: byUserId, module: "Tasks", action: "task.created",
      reason: `${task.title} → ${task.assigneeName}`,
    });
    toast.success("Task assigned", { description: `${assignedUser.firstName} · due ${format(new Date(due), "dd MMM")}` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign as task</DialogTitle>
          <DialogDescription>Track this as a follow-up in the assignee's task inbox.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Assignee</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {candidates.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} · {c.designation ?? c.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Due date</Label>
            <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Note (optional)</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} className="bg-lnx-teal-500 text-white hover:bg-lnx-teal-500/90">Create task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Export Institution Report (config + progress) ───────────────────────
const REPORT_SECTIONS = [
  "Executive Summary",
  "Academic Performance",
  "Attendance & Engagement",
  "Admissions Funnel",
  "Placements",
  "Finance Snapshot",
  "Compliance (NAAC / NBA / NIRF / AICTE)",
  "Risk Flags & Approvals",
];
export function ExportReportDialog({
  open, onOpenChange, period, onConfirm,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; period: Period;
  onConfirm: (cfg: { scope: string; sections: string[]; period: Period; format: "pdf" | "print" }) => void;
}) {
  const [scope, setScope] = useState("institution");
  const [sections, setSections] = useState<string[]>(REPORT_SECTIONS);
  const [fmt, setFmt] = useState<"pdf" | "print">("pdf");
  const [p, setP] = useState<Period>(period);

  const toggle = (s: string) =>
    setSections((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Institution Report</DialogTitle>
          <DialogDescription>Compiles live dashboard data into a single document.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Scope</Label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="institution">Institution-wide</SelectItem>
                  <SelectItem value="cse">CSE Department</SelectItem>
                  <SelectItem value="ece">ECE Department</SelectItem>
                  <SelectItem value="me">ME Department</SelectItem>
                  <SelectItem value="civil">Civil Department</SelectItem>
                  <SelectItem value="biotech">Biotech Department</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Period</Label>
              <Select value={p} onValueChange={(v) => setP(v as Period)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PERIOD_LABEL) as Period[]).map((k) => (
                    <SelectItem key={k} value={k}>{PERIOD_LABEL[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Sections</Label>
            <div className="mt-1 grid grid-cols-2 gap-1.5 rounded-md border p-3">
              {REPORT_SECTIONS.map((s) => (
                <label key={s} className="flex items-center gap-2 text-xs">
                  <Checkbox checked={sections.includes(s)} onCheckedChange={() => toggle(s)} />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">Format</Label>
            <RadioGroup value={fmt} onValueChange={(v) => setFmt(v as any)} className="mt-1 flex gap-4">
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="pdf" /> PDF download</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="print" /> Print preview</label>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!sections.length}
            onClick={() => { onConfirm({ scope, sections, period: p, format: fmt }); onOpenChange(false); }}
            className="bg-lnx-teal-500 text-white hover:bg-lnx-teal-500/90"
          >
            <FileBarChart className="mr-1 h-4 w-4" /> Generate ({sections.length} sections)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Segmented Announcement (live recipient count) ───────────────────────
export type Audience =
  | { kind: "all" }
  | { kind: "students" }
  | { kind: "parents" }
  | { kind: "faculty" }
  | { kind: "department"; department: string }
  | { kind: "year"; batch: string };

export function audienceMatch(u: User, a: Audience): boolean {
  switch (a.kind) {
    case "all": return true;
    case "students": return u.role === "student";
    case "parents": return u.role === "parent";
    case "faculty": return ["faculty", "lab_faculty", "hod"].includes(u.role);
    case "department": return u.department === a.department;
    case "year": return u.batch === a.batch;
  }
}

export function SegmentedAnnounceDialog({
  open, onOpenChange, users, byUserId, departments, batches, onSend,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  users: User[]; byUserId: string;
  departments: string[]; batches: string[];
  onSend: (a: Audience, channels: string[], subject: string, body: string, count: number) => void;
}) {
  const [kind, setKind] = useState<Audience["kind"]>("all");
  const [dept, setDept] = useState(departments[0] ?? "");
  const [batch, setBatch] = useState(batches[0] ?? "");
  const [subject, setSubject] = useState("Important Notice from the Director's Office");
  const [body, setBody] = useState("Dear Bharat Institute community,\n\n");
  const [channels, setChannels] = useState<string[]>(["email", "sms"]);

  const audience: Audience = useMemo(() => {
    if (kind === "department") return { kind: "department", department: dept };
    if (kind === "year") return { kind: "year", batch };
    return { kind } as Audience;
  }, [kind, dept, batch]);

  const recipients = useMemo(() => users.filter((u) => audienceMatch(u, audience)), [users, audience]);

  const toggleCh = (c: string) =>
    setChannels((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle><Megaphone className="mr-2 inline h-4 w-4" />Send Announcement</DialogTitle>
          <DialogDescription>Segment your audience — recipient count updates live.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Select value={kind} onValueChange={(v) => setKind(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                <SelectItem value="students">All Students</SelectItem>
                <SelectItem value="parents">All Parents</SelectItem>
                <SelectItem value="faculty">All Faculty/HOD</SelectItem>
                <SelectItem value="department">By Department</SelectItem>
                <SelectItem value="year">By Year/Batch</SelectItem>
              </SelectContent>
            </Select>
            {kind === "department" && (
              <Select value={dept} onValueChange={setDept}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {kind === "year" && (
              <Select value={batch} onValueChange={setBatch}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {batches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Badge variant="outline" className="justify-center text-xs">
              {recipients.length} recipient{recipients.length === 1 ? "" : "s"}
            </Badge>
          </div>
          <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="flex gap-3 text-sm">
            {["email", "sms", "whatsapp", "push"].map((c) => (
              <label key={c} className="flex items-center gap-1.5">
                <Checkbox checked={channels.includes(c)} onCheckedChange={() => toggleCh(c)} />
                <span className="capitalize">{c}</span>
              </label>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!recipients.length || !channels.length || !subject}
            onClick={() => { onSend(audience, channels, subject, body, recipients.length); onOpenChange(false); }}
            className="bg-lnx-teal-500 text-white hover:bg-lnx-teal-500/90"
          >
            Send to {recipients.length}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Retention / At-Risk widget ──────────────────────────────────────────
export interface AtRiskStudent { id: string; name: string; reason: string; severity: "critical" | "watch"; href: string; }
export function RetentionWidget({
  retentionPct, atRisk, onOpen,
}: {
  retentionPct: number; atRisk: AtRiskStudent[]; onOpen: (s: AtRiskStudent) => void;
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Retention & At-Risk</h3>
        <Badge variant="outline" className="text-xs">{retentionPct}% retention</Badge>
      </div>
      <Progress value={retentionPct} className="h-1.5" />
      <p className="mt-2 text-[11px] text-muted-foreground">
        {atRisk.length} student{atRisk.length === 1 ? "" : "s"} at risk · {atRisk.filter((s) => s.severity === "critical").length} critical
      </p>
      <ul className="mt-2 max-h-[180px] space-y-1 overflow-auto">
        {atRisk.map((s) => (
          <li key={s.id}>
            <button
              onClick={() => onOpen(s)}
              className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs hover:bg-accent"
            >
              <span className="min-w-0 truncate">
                <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${s.severity === "critical" ? "bg-lnx-red-500" : "bg-lnx-amber-500"}`} />
                <strong>{s.name}</strong>
                <span className="ml-1 text-muted-foreground">· {s.reason}</span>
              </span>
            </button>
          </li>
        ))}
        {atRisk.length === 0 && <li className="px-2 py-3 text-center text-xs text-muted-foreground">No at-risk students</li>}
      </ul>
    </Card>
  );
}

// ─── Deadlines mini-calendar ─────────────────────────────────────────────
export interface DeadlineItem { id: string; label: string; date: Date; module: string; href: string }
export function DeadlinesCalendar({ items }: { items: DeadlineItem[] }) {
  const sorted = [...items].sort((a, b) => a.date.getTime() - b.date.getTime());
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold"><Calendar className="mr-1 inline h-4 w-4" />Compliance & Deadlines</h3>
        <Badge variant="outline" className="text-xs">{items.length} upcoming</Badge>
      </div>
      <ul className="space-y-1">
        {sorted.map((d) => {
          const days = differenceInDays(d.date, new Date());
          const tone = days <= 30 ? "text-lnx-red-500" : days <= 60 ? "text-lnx-amber-500" : "text-lnx-navy-800";
          return (
            <li key={d.id}>
              <a href={d.href} className="flex items-center justify-between rounded px-2 py-1.5 text-xs hover:bg-accent">
                <span className="flex items-center gap-2 min-w-0">
                  <Stamp className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{d.label}</span>
                </span>
                <span className={`tabular flex-shrink-0 ${tone}`}>{days}d · {format(d.date, "dd MMM")}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

// ─── AQAR Draft modal (review before commit) ─────────────────────────────
export function AqarDraftDialog({
  open, onOpenChange, criteria, onCommit,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  criteria: { id: string; number: number; name?: string; readiness: number }[];
  onCommit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle><AlertTriangle className="mr-2 inline h-4 w-4" />AQAR Draft Review</DialogTitle>
          <DialogDescription>Generated from current evidence across 7 criteria.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[300px] space-y-1.5 overflow-auto">
          {criteria.map((c) => (
            <div key={c.id} className="flex items-center justify-between border-b py-1.5 text-sm last:border-0">
              <span>C{c.number} {c.name ? `· ${c.name}` : ""}</span>
              <span className={`tabular text-xs ${c.readiness >= 80 ? "text-lnx-green-500" : c.readiness >= 60 ? "text-lnx-amber-500" : "text-lnx-red-500"}`}>
                {c.readiness}% ready
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Draft includes evidence inventory, gap list, suggested narrative, and signature page. Submit only after committee review.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onCommit(); onOpenChange(false); }} className="bg-lnx-teal-500 text-white hover:bg-lnx-teal-500/90">
            <ListChecks className="mr-1 h-4 w-4" />Commit draft & notify IQAC
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
