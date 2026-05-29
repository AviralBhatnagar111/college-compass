import { GraduationCap } from "lucide-react";

export function Logo({ collapsed = false, light = true }: { collapsed?: boolean; light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-lnx-teal-500 text-white">
        <GraduationCap className="h-4 w-4" />
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-lnx-teal-100 ring-2 ring-lnx-navy-900" />
      </div>
      {!collapsed && (
        <div className={"text-base font-semibold tracking-tight " + (light ? "text-white" : "text-lnx-navy-800")}>
          LearnNow<span className="text-lnx-teal-500">X</span>
        </div>
      )}
    </div>
  );
}
