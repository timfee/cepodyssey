import { SessionManager, type SessionValidation } from "@/lib/auth/session-manager";

export async function validateSessionTokens(): Promise<SessionValidation> {
  return SessionManager.validate();
}
