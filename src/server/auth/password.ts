import "server-only";
import bcrypt from "bcryptjs";

/**
 * Password hashing — bcrypt via bcryptjs (pure JS, no native build step).
 * Cost factor 12 is a reasonable balance for an interactive login today
 * without needing a native/GPU-accelerated implementation.
 */
const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
