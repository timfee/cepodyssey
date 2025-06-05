import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { SessionManager } from "@/lib/auth/session-manager";
import { useAppDispatch, useAppSelector } from "./use-redux";
import {
  setDomain,
  setTenantId,
  resetAuthState,
} from "@/lib/redux/slices/app-state";
import { ErrorManager } from "@/lib/error-handling/error-manager";

interface SessionState {
  isAuthenticated: boolean;
  hasGoogleAuth: boolean;
  hasMicrosoftAuth: boolean;
  isLoading: boolean;
}

export function useSessionState(): SessionState {
  const { data: session, status, update } = useSession();
  const dispatch = useAppDispatch();
  const domain = useAppSelector((state) => state.app.domain);
  const tenantId = useAppSelector((state) => state.app.tenantId);
  const lastValidation = useRef<number>(Date.now());

  useEffect(() => {
    if (
      session?.authFlowDomain &&
      session.authFlowDomain !== domain
    ) {
      dispatch(setDomain(session.authFlowDomain));
    }
    if (
      session?.microsoftTenantId &&
      session.microsoftTenantId !== tenantId
    ) {
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
            },
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
