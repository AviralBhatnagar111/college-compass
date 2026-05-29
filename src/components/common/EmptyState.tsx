import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, body, action, className }: Props) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed bg-card p-10 text-center", className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-lnx-navy-800">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-base font-semibold text-lnx-navy-800">{title}</h3>
      {body && <p className="mt-1 max-w-md text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
