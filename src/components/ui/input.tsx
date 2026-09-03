import { forwardRef } from "react";

import { cn } from "@/lib/utils";

const control =
  "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink transition-colors " +
  "placeholder:text-ink-muted hover:border-line-strong " +
  "focus:border-brand-border focus:outline-2 focus:outline-offset-0 focus:outline-ring " +
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-muted " +
  "aria-[invalid=true]:border-status-critical aria-[invalid=true]:outline-status-critical";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(control, className)} {...props} />;
  },
);

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(control, "cursor-pointer appearance-none pr-9", className)}
      {...props}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(control, "h-auto min-h-20 resize-y py-2 leading-relaxed", className)}
      {...props}
    />
  );
});
