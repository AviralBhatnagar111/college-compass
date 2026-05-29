import { cn } from "@/lib/utils";

interface AvatarProps {
  initials?: string;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}
const sizes = { xs: "h-6 w-6 text-[10px]", sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg", xl: "h-20 w-20 text-2xl" };

export function Avatar({ initials = "U", color = "#01B6B9", size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn("inline-flex select-none items-center justify-center rounded-full font-semibold text-white shrink-0", sizes[size], className)}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}
