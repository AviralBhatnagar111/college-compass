import { useEffect, useState } from "react";
import { X, Repeat } from "lucide-react";
import { format } from "date-fns";
import { ROLE_LABEL } from "@/lib/types";
import type { User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardHero({ user, kpis, intro }: { user: User; kpis: React.ReactNode; intro?: React.ReactNode }) {
  const scopeLabel =
    user.scope.level === "institution" ? "Institution-wide" :
    user.scope.label ?? `${user.scope.level}: ${user.scope.ids.join(", ")}`;
  const honorific = user.role === "faculty" || user.role === "lab_faculty" || user.role === "hod" ? "Prof." :
    user.role === "hoi" ? "Dr." : "";
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-lnx-navy-800">
            {greeting()}, {honorific && `${honorific} `}{user.firstName}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{format(new Date(), "EEEE, dd MMM yyyy")}</span>
            <span>·</span>
            <Badge variant="outline" className="font-normal">{ROLE_LABEL[user.role]}</Badge>
            <span className="text-xs">{scopeLabel}</span>
          </div>
          {intro}
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>Last login: yesterday, 6:42 PM</div>
          <div className="tabular">IP 10.42.18.221 · Chrome / macOS</div>
        </div>
      </div>
      <div className="mt-5">{kpis}</div>
    </div>
  );
}

export function DemoBanner({ user }: { user: User }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    setOpen(sessionStorage.getItem("lnx-demo-banner-dismissed") !== "1");
  }, []);
  if (!open) return null;
  const honorific = user.role === "hoi" ? "Dr." : user.role === "parent" ? "Mr." : "";
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-lnx-teal-500/30 bg-lnx-teal-500/5 px-3 py-2 text-xs text-lnx-navy-800">
      <div className="flex items-center gap-2">
        <Repeat className="h-3.5 w-3.5 text-lnx-teal-500" />
        <span>You are viewing the demo as <strong>{honorific} {user.firstName} {user.lastName}</strong> · {ROLE_LABEL[user.role]}. Switch role from the top bar.</span>
      </div>
      <button
        aria-label="Dismiss banner"
        onClick={() => { sessionStorage.setItem("lnx-demo-banner-dismissed","1"); setOpen(false); }}
        className="rounded p-1 hover:bg-lnx-teal-500/10"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function Section({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={className}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function QuickAction({ icon: Icon, label, onClick, href, tone = "default" }: { icon: any; label: string; onClick?: () => void; href?: string; tone?: "default" | "primary" }) {
  const cls = tone === "primary"
    ? "border-lnx-teal-500 bg-lnx-teal-500/10 text-lnx-navy-800 hover:bg-lnx-teal-500/20"
    : "border bg-card text-lnx-navy-800 hover:border-lnx-teal-500 hover:bg-accent";
  const inner = (
    <span className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${cls}`}>
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </span>
  );
  if (href) {
    return <a href={href} className="block">{inner}</a>;
  }
  return <button onClick={onClick} className="text-left">{inner}</button>;
}
