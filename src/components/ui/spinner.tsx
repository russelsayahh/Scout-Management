import { cn } from "@/lib/utils";

/** Indeterminate progress indicator, used inside buttons while a form submits. */
export function Spinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
      role="status"
      aria-label={label}
    />
  );
}
