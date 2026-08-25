import { randomUUID } from "node:crypto";

import { DEMO_PASSWORD, demoAccounts } from "@/lib/auth/demo-accounts";
import { hashPassword } from "@/lib/auth/password";
import type { Role, SessionUser, StoredUser } from "@/lib/auth/types";
import { createJsonStore } from "@/lib/json-store";

/**
 * User repository.
 *
 * This is the only module that knows how users are persisted. Swapping in a
 * real database means reimplementing these functions and nothing else - the
 * service layer above it and the UI below never touch storage directly.
 *
 * Node-only.
 */

const store = createJsonStore<StoredUser>("users.json", async () => {
  const users: StoredUser[] = [];

  for (const account of demoAccounts) {
    users.push({
      id: randomUUID(),
      name: account.name,
      email: normaliseEmail(account.email),
      phone: account.phone,
      role: account.role,
      avatar: null,
      passwordHash: await hashPassword(DEMO_PASSWORD),
      createdAt: new Date().toISOString(),
    });
  }

  return users;
});

/** Strips the password hash. Everything leaving this module goes through it. */
export function toSessionUser(user: StoredUser): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/* --------------------------------- queries -------------------------------- */

export async function findById(id: string): Promise<StoredUser | null> {
  const users = await store.all();
  return users.find((user) => user.id === id) ?? null;
}

export async function findByEmail(email: string): Promise<StoredUser | null> {
  const target = normaliseEmail(email);
  const users = await store.all();
  return users.find((user) => user.email === target) ?? null;
}

export async function listUsers(): Promise<StoredUser[]> {
  const users = await store.all();
  return [...users].sort((a, b) => a.name.localeCompare(b.name));
}

export async function countByRole(role: Role): Promise<number> {
  const users = await store.all();
  return users.filter((user) => user.role === role).length;
}

/** True when `email` belongs to somebody other than `exceptId`. */
export async function emailTaken(email: string, exceptId?: string): Promise<boolean> {
  const target = normaliseEmail(email);
  const users = await store.all();
  return users.some((user) => user.email === target && user.id !== exceptId);
}

/* -------------------------------- mutations ------------------------------- */

export interface CreateUserInput {
  name: string;
  email: string;
  phone: string;
  role: Role;
  passwordHash: string;
}

/** Returns null when the email is already taken. */
export async function createUser(input: CreateUserInput): Promise<StoredUser | null> {
  return store.mutate((users) => {
    const email = normaliseEmail(input.email);
    if (users.some((user) => user.email === email)) return null;

    const user: StoredUser = {
      id: randomUUID(),
      name: input.name.trim(),
      email,
      phone: input.phone.trim(),
      role: input.role,
      avatar: null,
      passwordHash: input.passwordHash,
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    return user;
  });
}

/**
 * Applies `changes` to the user with `id`. Returns the updated user, or null if
 * the user no longer exists.
 */
export async function updateUser(
  id: string,
  changes: Partial<Omit<StoredUser, "id" | "createdAt">>,
): Promise<StoredUser | null> {
  return store.mutate((users) => {
    const index = users.findIndex((user) => user.id === id);
    if (index === -1) return null;

    const next: StoredUser = { ...users[index], ...changes };
    if (changes.email) next.email = normaliseEmail(changes.email);
    if (changes.name) next.name = changes.name.trim();
    if (changes.phone !== undefined) next.phone = changes.phone.trim();

    users[index] = next;
    return next;
  });
}
