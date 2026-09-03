import Link from "next/link";
import { Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { roleLabels, type Role } from "@/lib/auth/types";

/**
 * Shown when a signed-in user reaches a section their role does not cover.
 *
 * The navigation already hides these, so this is the backstop for a typed URL
 * or a stale link - it explains rather than redirecting silently.
 */
export function AccessDenied({
  sectionName,
  role,
}: {
  sectionName: string;
  role: Role;
}) {
  return (
    <Card className="mx-auto max-w-lg">
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-surface-inset text-ink-secondary">
          <Lock className="size-5" strokeWidth={1.75} aria-hidden />
        </span>

        <h1 className="mt-5 text-lg font-semibold tracking-tight text-ink">
          You do not have access to {sectionName}
        </h1>

        <p className="mt-2 max-w-sm text-[13px] text-ink-secondary">
          Your account is signed in as a{" "}
          <span className="font-medium text-ink">{roleLabels[role]}</span>, which does not
          include this section. An administrator can change your role if you need it.
        </p>

        <div className="mt-4">
          <Badge tone="neutral" dot>
            {roleLabels[role]}
          </Badge>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/" className={buttonStyles({ variant: "secondary" })}>
            Back to dashboard
          </Link>
          <Link href="/profile" className={buttonStyles({ variant: "ghost" })}>
            View your access
          </Link>
        </div>
      </div>
    </Card>
  );
}
