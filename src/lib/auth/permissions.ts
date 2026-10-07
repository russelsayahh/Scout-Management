import type { Role } from "@/lib/auth/types";

/**
 * Capabilities, named `<area>.<action>`. Navigation items and pages are gated on
 * these rather than on role directly, so adding a role is a table change here
 * instead of a hunt through the UI.
 */
export type Permission =
  | "dashboard.view"
  | "troops.view"
  | "troops.manage"
  | "scouts.view"
  | "scouts.manage"
  | "leaders.view"
  | "leaders.manage"
  | "patrols.view"
  | "patrols.manage"
  | "activities.view"
  | "activities.manage"
  | "camps.view"
  | "camps.manage"
  | "attendance.view"
  | "attendance.record"
  | "equipment.view"
  | "equipment.manage"
  | "documents.view"
  | "documents.manage"
  | "reports.view"
  | "settings.view"
  | "settings.manage"
  | "users.manage";

const administrator: Permission[] = [
  "dashboard.view",
  "troops.view",
  "troops.manage",
  "scouts.view",
  "scouts.manage",
  "leaders.view",
  "leaders.manage",
  "patrols.view",
  "patrols.manage",
  "activities.view",
  "activities.manage",
  "camps.view",
  "camps.manage",
  "attendance.view",
  "attendance.record",
  "equipment.view",
  "equipment.manage",
  "documents.view",
  "documents.manage",
  "reports.view",
  "settings.view",
  "settings.manage",
  "users.manage",
];

/** Runs the programme, but does not administer the group or its accounts. */
const scoutLeader: Permission[] = [
  "dashboard.view",
  "scouts.view",
  "scouts.manage",
  "leaders.view",
  "patrols.view",
  "patrols.manage",
  "activities.view",
  "activities.manage",
  "camps.view",
  "camps.manage",
  "attendance.view",
  "attendance.record",
  "equipment.view",
  "equipment.manage",
  "documents.view",
  "documents.manage",
  "reports.view",
];

/** Helps at meetings: can see records and take the register, but not edit. */
const assistantLeader: Permission[] = [
  "dashboard.view",
  "scouts.view",
  "patrols.view",
  "activities.view",
  "camps.view",
  "attendance.view",
  "attendance.record",
  "equipment.view",
  "documents.view",
];

export const rolePermissions: Record<Role, Permission[]> = {
  administrator,
  "scout-leader": scoutLeader,
  "assistant-leader": assistantLeader,
};

/** True when the role grants the permission. */
export function can(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

/** True when the role grants at least one of the permissions. */
export function canAny(role: Role, permissions: Permission[]): boolean {
  return permissions.some((permission) => can(role, permission));
}

/** Permissions granted to `role`, for display on the profile page. */
export function permissionsFor(role: Role): Permission[] {
  return rolePermissions[role];
}
