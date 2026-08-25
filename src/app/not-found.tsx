import Link from "next/link";
import { Compass } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-page px-6 text-center">
      <BrandMark className="mb-6" />

      <span className="flex size-12 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
        <Compass className="size-6" strokeWidth={1.75} aria-hidden />
      </span>

      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">Off the trail</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-secondary">
        That page does not exist. Check the address, or head back to the dashboard.
      </p>

      <Link href="/" className={buttonStyles({ className: "mt-6" })}>
        Back to dashboard
      </Link>
    </div>
  );
}
