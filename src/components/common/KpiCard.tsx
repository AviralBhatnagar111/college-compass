import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";

interface KpiProps {
  label: string;
  value: string | number;
  delta?: { value: string; up?: boolean };
  icon?: LucideIcon;
  tone?: "default" | "teal" | "amber" | "red" | "green";
  className?: string;
}

const tones: Record<string, string> = {
  default: "text-lnx-navy-800",
  teal: "text-lnx-teal-500",
  amber: "text-lnx-amber-500",
  red: "text-lnx-red-500",
  green: "text-lnx-green-500",
};

export function KpiCard({ label, value, delta, icon: Icon, tone = "default", className }: KpiProps) {
  return (
    <Card className={cn("p-5 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={cn("mt-2 text-2xl font-semibold tabular", tones[tone])}>{value}</p>
          {delta && (
            <div className={cn("mt-1 inline-flex items-center gap-1 text-xs", delta.up ? "text-lnx-green-500" : "text-lnx-red-500")}>
              {delta.up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {delta.value}
            </div>
          )}
        </div>
        {Icon && (
          <div className="rounded-md bg-accent p-2 text-lnx-navy-800">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </Card>
  );
}
