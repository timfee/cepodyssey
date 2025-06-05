import {
  resetAuthState,
  setDomain,
  setTenantId,
} from "@/lib/redux/slices/app-state";
import { Logger } from "@/lib/utils/logger";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useErrorHandler } from "./use-error-handler";
import { useAppDispatch, useAppSelector } from "./use-redux";

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
        // Only use update() from next-auth, do not call SessionManager or server-only code
        const updated = await update();
        if (updated?.error === "RefreshTokenError") {
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
          "[SessionSync]",
          "Syncing domain from session to Redux:",
          session.authFlowDomain
        );
        dispatch(setDomain(session.authFlowDomain));
      }
      if (session.microsoftTenantId && !tenantId) {
        Logger.info(
          "[SessionSync]",
          "Syncing tenant from session to Redux:",
          session.microsoftTenantId
        );
        dispatch(setTenantId(session.microsoftTenantId));
      }
    }
  }, [session, status, domain, tenantId, dispatch]);

  return { session, status };
}
