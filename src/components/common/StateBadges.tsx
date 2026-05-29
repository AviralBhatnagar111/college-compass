import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Clock, Lock, RefreshCw, Wrench, AlertTriangle } from "lucide-react";
import type { User } from "@/lib/types";

const tempDaysLeft = (iso?: string) => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
};

export function UserStateBadges({ user, compact }: { user: User; compact?: boolean }) {
  const temp = user.overrides.find(o => o.expiresAt);
  const days = temp ? tempDaysLeft(temp.expiresAt) : null;
  const icons: { key: string; icon: any; tip: string; tone: string }[] = [];
  if (user.editedByAdmin) icons.push({ key: "e", icon: Wrench, tip: "Edited by Admin", tone: "bg-amber-100 text-amber-700" });
  if (temp) icons.push({ key: "t", icon: Clock, tip: `Temporary access (${days}d left)`, tone: "bg-blue-100 text-blue-700" });
  if (user.hasSensitiveAccess) icons.push({ key: "s", icon: Lock, tip: "Sensitive access granted", tone: "bg-purple-100 text-purple-700" });
  if (user.restoredToDefault) icons.push({ key: "r", icon: RefreshCw, tip: "Restored to default", tone: "bg-emerald-100 text-emerald-700" });
  if (user.needsReview) icons.push({ key: "w", icon: AlertTriangle, tip: "Needs review — no pack assigned", tone: "bg-orange-100 text-orange-700" });
  if (!icons.length) return null;
  return (
    <TooltipProvider delayDuration={150}>
      <div className="inline-flex items-center gap-1">
        {icons.map(({ key, icon: Icon, tip, tone }) => (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded-full", tone)}>
                <Icon className="h-3 w-3" />
              </span>
            </TooltipTrigger>
            <TooltipContent>{tip}</TooltipContent>
          </Tooltip>
        ))}
        {!compact && temp && <Badge variant="outline" className="ml-1 text-[10px]">{days}d left</Badge>}
      </div>
    </TooltipProvider>
  );
}

export function StatusChip({ status }: { status: User["status"] | string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-slate-100 text-slate-600",
    pending: "bg-amber-100 text-amber-700",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize", map[status] ?? "bg-slate-100 text-slate-600")}>{status}</span>;
}

export function AttendanceChip({ pct }: { pct: number }) {
  const tone = pct >= 75 ? "bg-emerald-100 text-emerald-700" : pct >= 65 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tabular", tone)}>{pct}%</span>;
}
