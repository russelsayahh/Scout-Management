import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { requireGuest } from "@/lib/auth/current-user";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the Trailhead scout management platform.",
};

export default async function LoginPage() {
  // The middleware already bounces signed-in visitors; this covers a stale tab.
  await requireGuest();

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
