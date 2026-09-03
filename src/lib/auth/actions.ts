"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getCurrentUser, requireUser } from "@/lib/auth/current-user";
import type { FormState } from "@/lib/form-state";
import { can } from "@/lib/auth/permissions";
import * as service from "@/lib/auth/service";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
} from "@/lib/auth/session";
import { ROLES, roleLabels, type Role } from "@/lib/auth/types";
import {
  hasErrors,
  validateLoginInput,
  validatePasswordChangeInput,
  validateProfileInput,
  validateRegisterInput,
  type FieldErrors,
} from "@/lib/auth/validation";

/**
 * Server Actions are the only route between the UI and the auth service. Forms
 * submit here, validation runs here as the authority, and components stay free
 * of authentication logic.
 */

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function invalid(fieldErrors: FieldErrors, values: Record<string, string>): FormState {
  return {
    status: "error",
    message: "Please correct the highlighted fields.",
    fieldErrors,
    values,
  };
}

async function startSession(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Only same-origin, absolute-path destinations are honoured, so a crafted
 * `?from=` cannot bounce someone to another site after signing in.
 */
function safeRedirect(target: string): string {
  if (!target.startsWith("/") || target.startsWith("//")) return "/";
  return target;
}

/* ---------------------------------- login --------------------------------- */

export async function loginAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = field(formData, "email");
  const password = field(formData, "password");
  const values = { email };

  const fieldErrors = validateLoginInput({ email, password });
  if (hasErrors(fieldErrors)) return invalid(fieldErrors, values);

  const result = await service.authenticate(email, password);
  if (!result.ok) {
    return { status: "error", message: result.message, fieldErrors: result.fieldErrors, values };
  }

  await startSession(result.data.id);
  redirect(safeRedirect(field(formData, "redirectTo") || "/"));
}

/* -------------------------------- register -------------------------------- */

export async function registerAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = field(formData, "name");
  const email = field(formData, "email");
  const phone = field(formData, "phone");
  const role = field(formData, "role");
  const password = field(formData, "password");
  const confirmPassword = field(formData, "confirmPassword");
  const values = { name, email, phone, role };

  const fieldErrors = validateRegisterInput({
    name,
    email,
    phone,
    role,
    password,
    confirmPassword,
  });
  if (hasErrors(fieldErrors)) return invalid(fieldErrors, values);

  const result = await service.registerUser({
    name,
    email,
    phone,
    // Validation has already confined this to the self-signup roles.
    role: role as Role,
    password,
  });

  if (!result.ok) {
    return { status: "error", message: result.message, fieldErrors: result.fieldErrors, values };
  }

  await startSession(result.data.id);
  redirect("/");
}

/* --------------------------------- logout --------------------------------- */

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

/* --------------------------------- profile -------------------------------- */

export async function updateProfileAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const name = field(formData, "name");
  const email = field(formData, "email");
  const phone = field(formData, "phone");
  // An empty string means "remove the picture"; the field is absent when the
  // picture was not touched, in which case the stored one is kept.
  const rawAvatar = formData.get("avatar");
  const avatar =
    typeof rawAvatar === "string" ? (rawAvatar.length > 0 ? rawAvatar : null) : user.avatar;

  const values = { name, email, phone };

  const fieldErrors = validateProfileInput({ name, email, phone, avatar });
  if (hasErrors(fieldErrors)) return invalid(fieldErrors, values);

  const result = await service.updateProfile(user.id, { name, email, phone, avatar });
  if (!result.ok) {
    return { status: "error", message: result.message, fieldErrors: result.fieldErrors, values };
  }

  // The shell shows the name and picture, so refresh every route.
  revalidatePath("/", "layout");

  return { status: "success", message: "Profile updated." };
}

export async function changePasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const currentPassword = field(formData, "currentPassword");
  const newPassword = field(formData, "newPassword");
  const confirmPassword = field(formData, "confirmPassword");

  const fieldErrors = validatePasswordChangeInput({
    currentPassword,
    newPassword,
    confirmPassword,
  });
  if (hasErrors(fieldErrors)) return invalid(fieldErrors, {});

  const result = await service.changePassword(user.id, currentPassword, newPassword);
  if (!result.ok) {
    return { status: "error", message: result.message, fieldErrors: result.fieldErrors };
  }

  return { status: "success", message: "Password changed." };
}

/* ----------------------------- user management ---------------------------- */

export async function changeRoleAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await getCurrentUser();
  if (!actor || !can(actor.role, "users.manage")) {
    return { status: "error", message: "You do not have permission to change roles." };
  }

  const userId = field(formData, "userId");
  const role = field(formData, "role");

  if (!ROLES.includes(role as Role)) {
    return { status: "error", message: "Choose a valid role." };
  }

  const result = await service.changeRole(actor.id, userId, role as Role);
  if (!result.ok) return { status: "error", message: result.message };

  revalidatePath("/users");
  revalidatePath("/leaders");
  revalidatePath(`/leaders/${userId}`);

  // Phrased without an article so no role label needs "a" vs "an".
  return {
    status: "success",
    message: `${result.data.name} is now set to ${roleLabels[role as Role]}.`,
  };
}
