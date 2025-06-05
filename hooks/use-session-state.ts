import { SessionManager } from "@/lib/auth/utils/session-manager";
import { ErrorManager } from "@/lib/error-handling/error-manager";
import {
  resetAuthState,
  setDomain,
  setTenantId,
} from "@/lib/redux/slices/app-state";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "./use-redux";

/** Details about the user's current authentication state. */
interface SessionState {
  isAuthenticated: boolean;
  hasGoogleAuth: boolean;
  hasMicrosoftAuth: boolean;
  isLoading: boolean;
}

/**
 * Tracks authentication status across both providers and keeps Redux
 * state in sync with the NextAuth session.
 */
export function useSessionState(): SessionState {
  const { data: session, status, update } = useSession();
  const dispatch = useAppDispatch();
  const domain = useAppSelector((state) => state.app.domain);
  const tenantId = useAppSelector((state) => state.app.tenantId);
  const lastValidation = useRef<number>(Date.now());

  useEffect(() => {
    if (session?.authFlowDomain && session.authFlowDomain !== domain) {
      dispatch(setDomain(session.authFlowDomain));
    }
    if (session?.microsoftTenantId && session.microsoftTenantId !== tenantId) {
      dispatch(setTenantId(session.microsoftTenantId));
    }
  }, [session, dispatch, domain, tenantId]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (Date.now() - lastValidation.current > 5 * 60 * 1000) {
        lastValidation.current = Date.now();
        const valid = await SessionManager.refreshIfNeeded(() => update());
        if (!valid) {
          ErrorManager.dispatch(
            new Error("Session expired. Please sign in again."),
            {
              stepTitle: "Session",
            }
          );
          dispatch(resetAuthState());
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [update, dispatch]);

  return {
    isAuthenticated: status === "authenticated",
    hasGoogleAuth: session?.hasGoogleAuth ?? false,
    hasMicrosoftAuth: session?.hasMicrosoftAuth ?? false,
    isLoading: status === "loading",
  };
}
