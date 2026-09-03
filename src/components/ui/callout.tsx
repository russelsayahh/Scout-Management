import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type CalloutTone = "info" | "success" | "warning" | "error";

/** Tone is carried by an icon and the wording as well as by color. */
const toneIcon: Record<CalloutTone, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
};

const toneStyles: Record<CalloutTone, string> = {
  info: "border-viz-accent/30 bg-viz-accent/8 text-ink",
  success: "border-status-good/35 bg-status-good/8 text-ink",
  warning: "border-status-warning/40 bg-status-warning/10 text-ink",
  error: "border-status-critical/35 bg-status-critical/8 text-ink",
};

const iconStyles: Record<CalloutTone, string> = {
  info: "text-viz-accent",
  success: "text-status-good",
  warning: "text-status-warning",
  error: "text-status-critical",
};

export interface CalloutProps {
  tone?: CalloutTone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Callout({ tone = "info", title, children, className }: CalloutProps) {
  const Icon = toneIcon[tone];

  return (
    <div
      className={cn("flex gap-3 rounded-lg border px-3.5 py-3", toneStyles[tone], className)}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon className={cn("mt-px size-4 shrink-0", iconStyles[tone])} strokeWidth={2} aria-hidden />
      <div className="min-w-0 flex-1 text-[13px] leading-snug">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "text-ink-secondary")}>{children}</div>}
      </div>
    </div>
  );
}
