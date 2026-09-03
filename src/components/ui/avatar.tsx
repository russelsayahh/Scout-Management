import { cn } from "@/lib/utils";

const sizeStyles = {
  sm: "size-7 text-[11px]",
  md: "size-9 text-xs",
  lg: "size-11 text-sm",
  xl: "size-20 text-xl",
} as const;

/** Deterministic tint per name, so the same person keeps the same swatch. */
const tints = [
  "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200",
  "bg-viz-accent/15 text-[#1c5cab] dark:text-[#86b6ef]",
  "bg-status-serious/18 text-[#8f421e] dark:text-[#ec835a]",
  "bg-surface-inset text-ink-secondary",
];

function tintFor(seed: string) {
  let total = 0;
  for (let i = 0; i < seed.length; i += 1) total += seed.charCodeAt(i);
  return tints[total % tints.length];
}

export function initialsFrom(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  initials?: string;
  /** Profile picture. Falls back to initials when absent. */
  src?: string | null;
  size?: keyof typeof sizeStyles;
}

export function Avatar({
  name,
  initials,
  src,
  size = "md",
  className,
  ...props
}: AvatarProps) {
  const label = initials ?? initialsFrom(name);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold select-none",
        sizeStyles[size],
        src ? "bg-surface-inset" : tintFor(name),
        className,
      )}
      title={name}
      {...props}
    >
      {src ? (
        /* Profile pictures are stored as data URLs, which the next/image
           loader cannot optimise - a plain img is the right element here. */
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        label
      )}
    </span>
  );
}
