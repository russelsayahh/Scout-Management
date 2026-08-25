import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** Compass-rose mark used in the sidebar, the drawer and the sign-in surfaces. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-brand-solid text-white shadow-xs",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden focusable="false">
        <path
          d="M12 2.6l2.55 6.85L21.4 12l-6.85 2.55L12 21.4l-2.55-6.85L2.6 12l6.85-2.55L12 2.6z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

/** Mark plus wordmark. `compact` drops the text for the collapsed rail. */
export function BrandLockup({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2.5 rounded-lg", className)}
      aria-label={`${siteConfig.name} home`}
    >
      <BrandMark />
      {!compact && (
        <span className="min-w-0">
          <span className="block truncate text-[15px] leading-tight font-semibold tracking-tight text-ink">
            {siteConfig.name}
          </span>
          <span className="block truncate text-[11px] leading-tight text-ink-muted">
            {siteConfig.tagline}
          </span>
        </span>
      )}
    </Link>
  );
}
