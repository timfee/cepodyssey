import {
  SessionManager,
  type SessionValidation,
} from "@/lib/auth/utils/session-manager";

export async function validateSessionTokens(): Promise<SessionValidation> {
  return SessionManager.validate();
}
