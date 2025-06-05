import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { SessionManager } from "@/lib/auth/session-manager";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "./use-redux";
import { useErrorHandler } from "./use-error-handler";
import { Logger } from "@/lib/utils/logger";
import {
  resetAuthState,
  setDomain,
  setTenantId,
} from "@/lib/redux/slices/app-state";

/**
 * Periodically validates the user session and syncs domain and tenant
 * information from the session into Redux.
 */
export function useSessionSync() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { handleError } = useErrorHandler();
  const lastCheckRef = useRef<number>(Date.now());
  const domain = useAppSelector((state) => state.app.domain);
  const tenantId = useAppSelector((state) => state.app.tenantId);

  useEffect(() => {
    const checkInterval = setInterval(async () => {
      if (Date.now() - lastCheckRef.current > 5 * 60 * 1000) {
        lastCheckRef.current = Date.now();
        const valid = await SessionManager.refreshIfNeeded(() => update());
        if (!valid) {
          handleError(new Error("Session expired. Please sign in again."), {
            stepTitle: "Session",
          });
          dispatch(resetAuthState());
        }
      }
    }, 60000);
    return () => clearInterval(checkInterval);
  }, [update, router, dispatch, handleError]);

  useEffect(() => {
    if (session && status === "authenticated") {
      if (session.authFlowDomain && !domain) {
        Logger.info(
          '[SessionSync]',
          'Syncing domain from session to Redux:',
          session.authFlowDomain,
        );
        dispatch(setDomain(session.authFlowDomain));
      }
      if (session.microsoftTenantId && !tenantId) {
        Logger.info(
          '[SessionSync]',
          'Syncing tenant from session to Redux:',
          session.microsoftTenantId,
        );
        dispatch(setTenantId(session.microsoftTenantId));
      }
    }
  }, [session, status, domain, tenantId, dispatch]);

  return { session, status };
}
