// Generates a password hash in the exact format src/lib/auth/password.ts
// expects, for resetting an account directly in Supabase when nobody can
// sign in to use the app's own "Change password" page.
//
// Usage:
//   node scripts/generate-password-hash.mjs "NewPassword123!"
//
// Then, in the Supabase SQL Editor:
//   update users set "passwordHash" = '<hash printed below>' where email = '...';

import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/generate-password-hash.mjs "NewPassword123!"');
  process.exit(1);
}

const salt = randomBytes(SALT_LENGTH);
const derived = await scrypt(password, salt, KEY_LENGTH);
const hash = `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;

console.log("\nPaste this into the Supabase SQL Editor:\n");
console.log(`update users set "passwordHash" = '${hash}' where email = 'someone@example.com';`);
console.log("\n(replace the email above with the real account)\n");
