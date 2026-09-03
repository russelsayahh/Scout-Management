import { hashPassword, verifyPassword } from "@/lib/auth/password";
import * as store from "@/lib/auth/store";
import type { Role, SessionUser } from "@/lib/auth/types";
import type { FieldErrors } from "@/lib/auth/validation";

/**
 * Authentication and account rules. Everything above this layer (server
 * actions, pages, components) works with `ServiceResult` and never touches
 * password hashes or storage.
 *
 * Node-only.
 */

export type ServiceResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

function failure(message: string, fieldErrors?: FieldErrors): ServiceResult<never> {
  return { ok: false, message, fieldErrors };
}

export interface RegisterUserInput {
  name: string;
  email: string;
  phone: string;
  role: Role;
  password: string;
}

export async function registerUser(
  input: RegisterUserInput,
): Promise<ServiceResult<SessionUser>> {
  if (await store.emailTaken(input.email)) {
    return failure("That email address is already registered.", {
      email: "An account with this email already exists.",
    });
  }

  const created = await store.createUser({
    name: input.name,
    email: input.email,
    phone: input.phone,
    role: input.role,
    passwordHash: await hashPassword(input.password),
  });

  // createUser returns null only when the email was claimed between the check
  // above and the write.
  if (!created) {
    return failure("That email address is already registered.", {
      email: "An account with this email already exists.",
    });
  }

  return { ok: true, data: store.toSessionUser(created) };
}

/**
 * Verifies credentials. The same message is returned whether the email is
 * unknown or the password is wrong, so the response cannot be used to discover
 * which addresses have accounts.
 */
export async function authenticate(
  email: string,
  password: string,
): Promise<ServiceResult<SessionUser>> {
  const user = await store.findByEmail(email);
  const invalid = failure("Email or password is incorrect.");

  if (!user) {
    // Hash anyway so a missing account is not measurably faster than a wrong
    // password.
    await hashPassword(password);
    return invalid;
  }

  const matches = await verifyPassword(password, user.passwordHash);
  if (!matches) return invalid;

  return { ok: true, data: store.toSessionUser(user) };
}

export async function getUser(id: string): Promise<SessionUser | null> {
  const user = await store.findById(id);
  return user ? store.toSessionUser(user) : null;
}

export interface UpdateProfileInput {
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<ServiceResult<SessionUser>> {
  if (await store.emailTaken(input.email, userId)) {
    return failure("That email address is already in use.", {
      email: "Another account already uses this email.",
    });
  }

  const updated = await store.updateUser(userId, {
    name: input.name,
    email: input.email,
    phone: input.phone,
    avatar: input.avatar,
  });

  if (!updated) return failure("Your account could not be found.");

  return { ok: true, data: store.toSessionUser(updated) };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<ServiceResult> {
  const user = await store.findById(userId);
  if (!user) return failure("Your account could not be found.");

  const matches = await verifyPassword(currentPassword, user.passwordHash);
  if (!matches) {
    return failure("Your current password is incorrect.", {
      currentPassword: "This does not match your current password.",
    });
  }

  const updated = await store.updateUser(userId, {
    passwordHash: await hashPassword(newPassword),
  });
  if (!updated) return failure("Your account could not be found.");

  return { ok: true, data: undefined };
}

export async function listUsers(): Promise<SessionUser[]> {
  const users = await store.listUsers();
  return users.map(store.toSessionUser);
}

/**
 * Role changes, with the two guards that keep an administrator in the group:
 * nobody edits their own role, and the last administrator cannot be demoted.
 */
export async function changeRole(
  actorId: string,
  targetId: string,
  role: Role,
): Promise<ServiceResult<SessionUser>> {
  if (actorId === targetId) {
    return failure("You cannot change your own role. Ask another administrator.");
  }

  const target = await store.findById(targetId);
  if (!target) return failure("That user could not be found.");
  if (target.role === role) return { ok: true, data: store.toSessionUser(target) };

  if (target.role === "administrator") {
    const administrators = await store.countByRole("administrator");
    if (administrators <= 1) {
      return failure("This is the only administrator. Promote someone else first.");
    }
  }

  const updated = await store.updateUser(targetId, { role });
  if (!updated) return failure("That user could not be found.");

  return { ok: true, data: store.toSessionUser(updated) };
}
