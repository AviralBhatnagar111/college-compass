import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  filters?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, filters, className }: Props) {
  return (
    <div className={cn("mb-6 space-y-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-lnx-navy-800">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {filters}
    </div>
  );
}
