import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "./use-redux";
import {
  setDomain,
  setTenantId,
  resetAuthState,
} from "@/lib/redux/slices/app-config";
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
  const appConfig = useAppSelector((state) => state.appConfig);
  const lastValidation = useRef<number>(Date.now());

  useEffect(() => {
    if (
      session?.authFlowDomain &&
      session.authFlowDomain !== appConfig.domain
    ) {
      dispatch(setDomain(session.authFlowDomain));
    }
    if (
      session?.microsoftTenantId &&
      session.microsoftTenantId !== appConfig.tenantId
    ) {
      dispatch(setTenantId(session.microsoftTenantId));
    }
  }, [session, dispatch, appConfig.domain, appConfig.tenantId]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (Date.now() - lastValidation.current > 5 * 60 * 1000) {
        lastValidation.current = Date.now();
        const updated = await update();
        if (updated?.error === "RefreshTokenError") {
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
