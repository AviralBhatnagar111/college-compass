import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Info, type LucideIcon } from "lucide-react";

interface KpiProps {
  label: string;
  value: string | number;
  delta?: { value: string; up?: boolean };
  icon?: LucideIcon;
  tone?: "default" | "teal" | "amber" | "red" | "green";
  className?: string;
  // Optional extensions (HOI dashboard period-aware tiles)
  spark?: number[];                                // 4-12 numbers
  target?: { value: number; label?: string; current?: number };
  status?: "on-track" | "watch" | "breach";
  onExplain?: () => void;
}

const tones: Record<string, string> = {
  default: "text-lnx-navy-800",
  teal: "text-lnx-teal-500",
  amber: "text-lnx-amber-500",
  red: "text-lnx-red-500",
  green: "text-lnx-green-500",
};

const statusDot: Record<string, string> = {
  "on-track": "bg-lnx-green-500",
  watch: "bg-lnx-amber-500",
  breach: "bg-lnx-red-500",
};
const statusStroke: Record<string, string> = {
  "on-track": "stroke-lnx-green-500",
  watch: "stroke-lnx-amber-500",
  breach: "stroke-lnx-red-500",
};

function Sparkline({ data, status }: { data: number[]; status?: KpiProps["status"] }) {
  if (!data.length) return null;
  const w = 80, h = 22, pad = 1;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = pad + (i * (w - pad * 2)) / (data.length - 1 || 1);
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const stroke = status ? statusStroke[status] : "stroke-lnx-teal-500";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline fill="none" strokeWidth={1.5} className={stroke} points={points} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function KpiCard({ label, value, delta, icon: Icon, tone = "default", className, spark, target, status, onExplain }: KpiProps) {
  return (
    <Card className={cn("p-5 shadow-sm relative", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            {label}
            {status && <span className={cn("inline-block h-1.5 w-1.5 rounded-full", statusDot[status])} aria-label={status} />}
          </p>
          <p className={cn("mt-2 text-2xl font-semibold tabular", tones[tone])}>{value}</p>
          {delta && (
            <div className={cn("mt-1 inline-flex items-center gap-1 text-xs", delta.up ? "text-lnx-green-500" : "text-lnx-red-500")}>
              {delta.up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {delta.value}
            </div>
          )}
          {target && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              Target {target.label ?? target.value}
              {typeof target.current === "number" && ` · ${target.current} now`}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {Icon && (
            <div className="rounded-md bg-accent p-2 text-lnx-navy-800">
              <Icon className="h-4 w-4" />
            </div>
          )}
          {spark && spark.length > 1 && <Sparkline data={spark} status={status} />}
        </div>
      </div>
      {onExplain && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onExplain(); }}
          aria-label="Explain this number"
          className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-lnx-teal-500"
        >
          <Info className="h-3 w-3" /> Explain
        </button>
      )}
    </Card>
  );
}
