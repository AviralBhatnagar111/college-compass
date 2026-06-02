// Shared workbench primitives — ActionQueueCard + dialog suite
// Every dashboard widget uses these so all buttons actually work.

import { useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { CheckCircle2, AlertTriangle, Loader2, MessageSquare, Mail, Smartphone, FileText, ShieldCheck, Download, Inbox } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";

// ─── ActionQueueCard ────────────────────────────────────────────────────
export interface QueueAction<T> {
  label: string;
  tone?: "primary" | "danger" | "ghost" | "default";
  icon?: any;
  onClick: (row: T) => void;
}

export function ActionQueueCard<T extends { id: string }>({
  title, count, badgeTone = "danger", emptyText = "Queue is clear", rows,
  renderRow, actions, footer, headerExtra, columns,
}: {
  title: string;
  count?: number;
  badgeTone?: "danger" | "amber" | "muted";
  emptyText?: string;
  rows: T[];
  renderRow: (row: T) => ReactNode;
  actions: QueueAction<T>[];
  footer?: ReactNode;
  headerExtra?: ReactNode;
  columns?: string[];
}) {
  const total = count ?? rows.length;
  const badgeCls =
    badgeTone === "danger" ? "bg-lnx-red-500/15 text-lnx-red-500 border-lnx-red-500/30" :
    badgeTone === "amber"  ? "bg-lnx-amber-500/15 text-lnx-amber-500 border-lnx-amber-500/30" :
                             "bg-muted text-muted-foreground border-border";
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-lnx-navy-800">{title}</h3>
          <Badge variant="outline" className={cn("text-xs", badgeCls)}>{total}</Badge>
        </div>
        {headerExtra}
      </div>
      {columns && rows.length > 0 && (
        <div className="grid border-b bg-muted/30 px-4 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground" style={{ gridTemplateColumns: columns.join(" ") }}>
          {columns.map((_, i) => i === 0 ? <div key={i}>Item</div> : <div key={i}>{i === columns.length - 1 ? "Actions" : ""}</div>)}
        </div>
      )}
      <ScrollArea className="max-h-[340px]">
        {rows.length === 0 ? (
          <div className="p-6">
            <div className="flex flex-col items-center gap-1 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="h-6 w-6 text-lnx-green-500" />
              <p>{emptyText}</p>
            </div>
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map(row => (
              <li key={row.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">{renderRow(row)}</div>
                <div className="flex flex-shrink-0 flex-wrap gap-1.5">
                  {actions.map(a => {
                    const Icon = a.icon;
                    const variant: any =
                      a.tone === "primary" ? "default" :
                      a.tone === "danger" ? "outline" :
                      "ghost";
                    return (
                      <Button
                        key={a.label} size="sm" variant={variant}
                        onClick={() => a.onClick(row)}
                        className={cn(
                          "h-7 text-xs",
                          a.tone === "primary" && "bg-lnx-teal-500 text-white hover:bg-lnx-teal-500/90",
                          a.tone === "danger" && "border-lnx-red-500/40 text-lnx-red-500 hover:bg-lnx-red-500/10",
                        )}
                      >
                        {Icon && <Icon className="mr-1 h-3 w-3" />}
                        {a.label}
                      </Button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
      {footer && <div className="border-t bg-muted/20 px-4 py-2 text-xs">{footer}</div>}
    </Card>
  );
}

// ─── ConfirmDialog ──────────────────────────────────────────────────────
export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel = "Confirm", tone = "primary",
  onConfirm, withComment = false, commentPlaceholder = "Optional comment…",
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  title: string; description?: string;
  confirmLabel?: string; tone?: "primary" | "danger";
  onConfirm: (comment: string) => void;
  withComment?: boolean; commentPlaceholder?: string;
}) {
  const [comment, setComment] = useState("");
  const handleConfirm = () => { onConfirm(comment); setComment(""); onOpenChange(false); };
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setComment(""); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {withComment && (
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={commentPlaceholder} rows={3} />
        )}
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            className={cn(tone === "danger"
              ? "bg-lnx-red-500 text-white hover:bg-lnx-red-500/90"
              : "bg-lnx-teal-500 text-white hover:bg-lnx-teal-500/90")}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ReasonDialog (required reason for rejection / override) ─────────────
export function ReasonDialog({
  open, onOpenChange, title, description, confirmLabel = "Submit", tone = "danger",
  onSubmit, placeholder = "Reason is required…",
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  title: string; description?: string;
  confirmLabel?: string; tone?: "primary" | "danger";
  onSubmit: (reason: string) => void;
  placeholder?: string;
}) {
  const [reason, setReason] = useState("");
  const submit = () => { if (!reason.trim()) return; onSubmit(reason.trim()); setReason(""); onOpenChange(false); };
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setReason(""); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-xs">Reason <span className="text-lnx-red-500">*</span></Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={placeholder} rows={4} />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!reason.trim()} onClick={submit}
            className={cn(tone === "danger"
              ? "bg-lnx-red-500 text-white hover:bg-lnx-red-500/90"
              : "bg-lnx-teal-500 text-white hover:bg-lnx-teal-500/90")}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── MultiChannelPreviewDialog ──────────────────────────────────────────
export function MultiChannelPreviewDialog({
  open, onOpenChange, title, subject, body, recipients,
  defaultChannels = ["sms", "whatsapp", "email"], onSend,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  title: string;
  subject?: string;
  body: string;
  recipients: { id: string; name: string; phone?: string; email?: string }[];
  defaultChannels?: ("sms" | "whatsapp" | "email")[];
  onSend: (channels: string[]) => void;
}) {
  const [channels, setChannels] = useState<string[]>(defaultChannels);
  const toggle = (c: string) => setChannels(s => s.includes(c) ? s.filter(x => x !== c) : [...s, c]);
  const send = () => { if (!channels.length) return; onSend(channels); onOpenChange(false); };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Preview message across channels before sending to {recipients.length} recipient{recipients.length !== 1 ? "s" : ""}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "sms", label: "SMS", icon: Smartphone },
              { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
              { id: "email", label: "Email", icon: Mail },
            ].map(c => {
              const Icon = c.icon;
              const on = channels.includes(c.id);
              return (
                <button
                  key={c.id} onClick={() => toggle(c.id)}
                  className={cn("flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition",
                    on ? "border-lnx-teal-500 bg-lnx-teal-500/10 text-lnx-navy-800" : "border-border text-muted-foreground hover:border-lnx-teal-500/40")}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {c.label}
                  {on && <CheckCircle2 className="h-3 w-3 text-lnx-teal-500" />}
                </button>
              );
            })}
          </div>
          <Tabs defaultValue={channels[0] ?? "sms"}>
            <TabsList className="h-8">
              {channels.map(c => <TabsTrigger key={c} value={c} className="text-xs">{c.toUpperCase()}</TabsTrigger>)}
            </TabsList>
            {channels.map(c => (
              <TabsContent key={c} value={c} className="mt-3">
                <div className="rounded-lg border bg-muted/30 p-3">
                  {c === "email" && subject && <div className="mb-1 text-xs text-muted-foreground">Subject: <span className="font-medium text-foreground">{subject}</span></div>}
                  <p className="whitespace-pre-line text-sm">{body}</p>
                </div>
              </TabsContent>
            ))}
          </Tabs>
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs">
            <p className="mb-1 font-medium text-foreground">Recipients ({recipients.length})</p>
            <p className="text-muted-foreground">{recipients.slice(0, 3).map(r => r.name).join(", ")}{recipients.length > 3 ? ` +${recipients.length - 3} more` : ""}</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!channels.length} onClick={send} className="bg-lnx-teal-500 text-white hover:bg-lnx-teal-500/90">
            Send via {channels.length} channel{channels.length !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── PdfPreviewDialog (mock document generation) ────────────────────────
export function PdfPreviewDialog({
  open, onOpenChange, title, docType, recipient, fields = [],
  confirmLabel = "Issue Document", onConfirm,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  title: string; docType: string; recipient: string;
  fields?: { label: string; value: string }[];
  confirmLabel?: string;
  onConfirm: () => void;
}) {
  const [phase, setPhase] = useState<"preview" | "generating" | "done">("preview");
  const generate = () => {
    setPhase("generating");
    setTimeout(() => { setPhase("done"); onConfirm(); setTimeout(() => { setPhase("preview"); onOpenChange(false); }, 900); }, 1400);
  };
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setPhase("preview"); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{docType} for {recipient}</DialogDescription>
        </DialogHeader>
        {phase === "preview" && (
          <div className="rounded-lg border-2 border-dashed border-border bg-muted/20 p-6">
            <div className="mx-auto max-w-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="text-sm font-semibold text-lnx-navy-800">Bharat Institute of Engineering</p>
                  <p className="text-[10px] text-muted-foreground">Affiliated · NAAC A+ · NBA Accredited</p>
                </div>
                <FileText className="h-6 w-6 text-lnx-teal-500" />
              </div>
              <p className="text-center text-sm font-semibold uppercase tracking-wide">{docType}</p>
              <p className="text-xs text-muted-foreground">This is to certify that</p>
              <p className="text-base font-semibold text-lnx-navy-800">{recipient}</p>
              {fields.map(f => (
                <div key={f.label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-medium">{f.value}</span>
                </div>
              ))}
              <p className="pt-2 text-[10px] text-muted-foreground">Generated digitally · Verifiable via QR · Doc ID DOC-{Math.random().toString(36).slice(2, 8).toUpperCase()}</p>
            </div>
          </div>
        )}
        {phase === "generating" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="h-10 w-10 animate-spin text-lnx-teal-500" />
            <p className="text-sm text-muted-foreground">Generating document…</p>
          </div>
        )}
        {phase === "done" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <CheckCircle2 className="h-12 w-12 text-lnx-green-500" />
            <p className="text-sm font-medium">Document issued</p>
            <p className="text-xs text-muted-foreground">Available in recipient's Documents tab</p>
          </div>
        )}
        {phase === "preview" && (
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={generate} className="bg-lnx-teal-500 text-white hover:bg-lnx-teal-500/90">
              <Download className="mr-1 h-3.5 w-3.5" />
              {confirmLabel}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── DigiLockerMock ─────────────────────────────────────────────────────
export function DigiLockerDialog({
  open, onOpenChange, studentName, onVerified,
}: { open: boolean; onOpenChange: (v: boolean) => void; studentName: string; onVerified: () => void }) {
  const [phase, setPhase] = useState<"auth" | "fetching" | "success">("auth");
  const [aadhaar, setAadhaar] = useState("");
  const startOAuth = () => {
    setPhase("fetching");
    setTimeout(() => { setPhase("success"); setTimeout(() => { onVerified(); setPhase("auth"); setAadhaar(""); onOpenChange(false); }, 1000); }, 1500);
  };
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setPhase("auth"); setAadhaar(""); } onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-lnx-teal-500" />DigiLocker Verification</DialogTitle>
          <DialogDescription>Fetch verified documents for {studentName} from DigiLocker.</DialogDescription>
        </DialogHeader>
        {phase === "auth" && (
          <div className="space-y-3">
            <div className="rounded-lg border bg-muted/20 p-3 text-xs">
              <p className="mb-1 font-medium text-lnx-navy-800">Documents to fetch:</p>
              <ul className="ml-3 list-disc space-y-0.5 text-muted-foreground">
                <li>10th Marksheet · CBSE</li>
                <li>12th Marksheet · CBSE</li>
                <li>Aadhaar (masked) · UIDAI</li>
                <li>APAAR ID (auto-issued)</li>
              </ul>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Aadhaar / Mobile (demo)</Label>
              <Input value={aadhaar} onChange={(e) => setAadhaar(e.target.value)} placeholder="XXXX XXXX 4892" />
            </div>
          </div>
        )}
        {phase === "fetching" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="h-10 w-10 animate-spin text-lnx-teal-500" />
            <p className="text-sm">Fetching from DigiLocker…</p>
            <p className="text-xs text-muted-foreground">Authorizing via UIDAI · Pulling APAAR</p>
          </div>
        )}
        {phase === "success" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <CheckCircle2 className="h-12 w-12 text-lnx-green-500" />
            <p className="text-sm font-medium">4 documents verified</p>
            <p className="text-xs text-muted-foreground">APAAR ID linked · Student record updated</p>
          </div>
        )}
        {phase === "auth" && (
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={startOAuth} className="bg-lnx-teal-500 text-white hover:bg-lnx-teal-500/90">Authorize & Fetch</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── BulkTransferDialog (refund processing) ─────────────────────────────
export function BulkTransferDialog({
  open, onOpenChange, title, items, onConfirm,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  title: string;
  items: { id: string; name: string; amount: number }[];
  onConfirm: (utr: string) => void;
}) {
  const [utr, setUtr] = useState("");
  const total = items.reduce((a, i) => a + i.amount, 0);
  const submit = () => { if (!utr.trim()) return; onConfirm(utr); setUtr(""); onOpenChange(false); };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Mark {items.length} item{items.length !== 1 ? "s" : ""} as transferred via bank.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <ScrollArea className="max-h-40 rounded-md border">
            <ul className="divide-y text-xs">
              {items.map(i => (
                <li key={i.id} className="flex items-center justify-between px-3 py-2">
                  <span>{i.name}</span>
                  <span className="font-medium">₹{i.amount.toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
          <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
            <span>Total transfer</span>
            <span className="font-semibold">₹{total.toLocaleString("en-IN")}</span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Bank UTR Reference <span className="text-lnx-red-500">*</span></Label>
            <Input value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="UTR2026060201234567" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!utr.trim()} onClick={submit} className="bg-lnx-teal-500 text-white hover:bg-lnx-teal-500/90">Mark as Transferred</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ProgressDialog (export, AQAR, NSP sync) ────────────────────────────
export function ProgressDialog({
  open, onOpenChange, title, description, durationMs = 2500, onComplete, successText = "Done",
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  title: string; description?: string;
  durationMs?: number; onComplete?: () => void;
  successText?: string;
}) {
  const [done, setDone] = useState(false);
  if (open && !done) {
    setTimeout(() => { setDone(true); onComplete?.(); setTimeout(() => { onOpenChange(false); setDone(false); }, 1100); }, durationMs);
  }
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setDone(false); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-8">
          {done ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-lnx-green-500" />
              <p className="text-sm font-medium">{successText}</p>
            </>
          ) : (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-lnx-teal-500" />
              <p className="text-sm text-muted-foreground">Processing…</p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── RiskFlag (used on HOI risk-flag widget) ────────────────────────────
export function RiskFlag({ icon: Icon, title, action, tone = "amber", onClick }: { icon: any; title: string; action?: ReactNode; tone?: "red" | "amber"; onClick?: () => void }) {
  const cls = tone === "red"
    ? "border-lnx-red-500/30 bg-lnx-red-500/5"
    : "border-lnx-amber-500/30 bg-lnx-amber-500/5";
  const iconCls = tone === "red" ? "text-lnx-red-500" : "text-lnx-amber-500";
  return (
    <button
      onClick={onClick}
      className={cn("flex w-full items-start gap-2 rounded-lg border p-3 text-left transition hover:shadow-sm", cls)}
    >
      <Icon className={cn("h-4 w-4 flex-shrink-0 mt-0.5", iconCls)} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-lnx-navy-800">{title}</p>
        {action && <div className="mt-1">{action}</div>}
      </div>
    </button>
  );
}
