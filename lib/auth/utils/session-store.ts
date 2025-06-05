import type { JWT } from "next-auth/jwt";
import type { User } from "next-auth";

const ADMIN_USER_KEY = "admin-user";
const accountStore = new Map<string, JWT>();

export function getUserKey(_userOrToken?: User | JWT): string {
  return ADMIN_USER_KEY;
}

export function getStoredToken(): JWT | undefined {
  return accountStore.get(getUserKey());
}

export function setStoredToken(token: JWT): void {
  accountStore.set(getUserKey(), token);
}

export function cleanupInvalidSession(): void {
  accountStore.delete(getUserKey());
}
