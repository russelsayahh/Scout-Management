import { AccessDenied } from "@/components/shared/access-denied";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import type { ModuleConfig } from "@/types";

/**
 * A section page in one component: check the signed-in role against the
 * module's permission, then render the section or an explanation.
 *
 * Every section route goes through this, so authorisation cannot be forgotten
 * on a new page - it comes with the component that renders it.
 */
export async function ModuleSection({ module }: { module: ModuleConfig }) {
  const user = await requireUser();

  if (!can(user.role, module.permission)) {
    return <AccessDenied sectionName={module.name} role={user.role} />;
  }

  const canManage = module.managePermission
    ? can(user.role, module.managePermission)
    : false;

  return <ModulePlaceholder module={module} canManage={canManage} />;
}
