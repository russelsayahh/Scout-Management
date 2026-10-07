/** The three roles the platform recognises. */
export type Role = "administrator" | "scout-leader" | "assistant-leader";

export const ROLES: Role[] = ["administrator", "scout-leader", "assistant-leader"];

/** Roles a person may choose when registering themselves. */
export const SELF_SIGNUP_ROLES: Role[] = ["scout-leader", "assistant-leader"];

export const roleLabels: Record<Role, string> = {
  administrator: "Administrator",
  "scout-leader": "Scout Leader",
  "assistant-leader": "Assistant Leader",
};

export const roleDescriptions: Record<Role, string> = {
  administrator: "Full access, including group settings and user accounts.",
  "scout-leader": "Runs the programme: members, camps, attendance and resources.",
  "assistant-leader": "Supports meetings: can view records and take the register.",
};

/**
 * A user as persisted. Never send this to the client - it carries the password
 * hash. Use `toSessionUser` in the store to strip it.
 */
export interface StoredUser {
  id: string;
  name: string;
  /** Always stored lower-cased; it is the login identity. */
  email: string;
  phone: string;
  role: Role;
  /** Data URL, or null when the user has no picture. */
  avatar: string | null;
  /** Free-text title, e.g. "Group Scout Leader" or "Quartermaster". Not the same as `role`, which drives permissions. */
  position: string;
  /** Patrol ids this leader has been given responsibility for. */
  assignedPatrolIds: string[];
  /**
   * Troop ids this leader may access. This is the access-control boundary -
   * an administrator ignores it and sees every troop; anyone else sees only
   * what is listed here, on both the frontend and every server-side query.
   */
  assignedTroopIds: string[];
  passwordHash: string;
  createdAt: string;
}

/** The safe projection of a user that reaches the browser. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatar: string | null;
  position: string;
  assignedPatrolIds: string[];
  assignedTroopIds: string[];
  createdAt: string;
}
