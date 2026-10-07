import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** Group crest (fleur-de-lis badge) used in the sidebar, the drawer and the sign-in surfaces. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-xs",
        className,
      )}
    >
      <Image
        src="/logo.png"
        alt=""
        width={72}
        height={72}
        className="size-full object-cover"
        priority
      />
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
