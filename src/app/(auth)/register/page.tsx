import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";
import { requireGuest } from "@/lib/auth/current-user";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a Trailhead account for your scout group.",
};

export default async function RegisterPage() {
  await requireGuest();

  return <RegisterForm />;
}
