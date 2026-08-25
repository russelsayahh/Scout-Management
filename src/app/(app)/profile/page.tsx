import type { Metadata } from "next";

import { AccessSummary } from "@/components/profile/access-summary";
import { PasswordForm } from "@/components/profile/password-form";
import { ProfileDetailsForm } from "@/components/profile/profile-details-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/current-user";

export const metadata: Metadata = {
  title: "Your profile",
  description: "Update your details, picture and password.",
};

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your profile"
        description="Update how you appear to the group, and change your password."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <ProfileDetailsForm user={user} />
          <PasswordForm />
        </div>

        <div className="space-y-4">
          <AccessSummary user={user} />
        </div>
      </div>
    </div>
  );
}
