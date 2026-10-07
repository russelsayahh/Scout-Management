import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";
import { siteConfig } from "@/config/site";
import { requireGuest } from "@/lib/auth/current-user";
import { listTroops } from "@/lib/troops/service";

export const metadata: Metadata = {
  title: "Create an account",
  description: `Create a ${siteConfig.name} account for your scout group.`,
};

export default async function RegisterPage() {
  await requireGuest();

  // Every troop is offered here - nobody is signed in yet, so there is no
  // scope to narrow this to, and picking a troop is what a scope will be
  // built from once they are.
  const troops = await listTroops();

  return <RegisterForm troops={troops} />;
}
