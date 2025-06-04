import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSelector } from "./use-redux";
import { useSessionSync } from "./use-session-sync";
import { Logger } from "@/lib/utils/logger";

/**
 * Runs lightweight `check` functions after configuration becomes available.
 *
 * @param executeCheck - Callback executed for each step needing a check
 * @returns void
 */
export function useAutoCheck(
  executeCheck: (stepId: string) => Promise<void>,
): void {
  const appConfig = useAppSelector((state) => state.appConfig);
  const stepsStatus = useAppSelector((state) => state.setupSteps.steps);
  const hasChecked = useRef(false);
  const [isValidating, setIsValidating] = useState(false);
  const { session, status } = useSessionSync();
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset when domain changes
  useEffect(() => {
    hasChecked.current = false;
  }, [appConfig.domain]);

  // Debounced check function
  const debouncedCheck = useCallback(() => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
    checkTimeoutRef.current = setTimeout(async () => {
      // Skip if already checking
      if (hasChecked.current || isValidating) return;

      // Skip if config not ready
      if (!appConfig.domain || !appConfig.tenantId) return;

      // Skip if session is still loading
      if (status === "loading") return;

      // Skip if session not ready
      if (!session?.hasGoogleAuth || !session?.hasMicrosoftAuth) return;


      setIsValidating(true);

      try {
        // Check if session has required tokens
        if (!session.googleToken || !session.microsoftToken) {
          Logger.warn(
            "[Hook]",
            "Session missing required tokens, skipping auto-check",
          );
          setIsValidating(false);
          return;
        }

        // Check for refresh token error
        if (session.error === "RefreshTokenError") {
          Logger.warn(
            "[Hook]",
            "Session has refresh token error, skipping auto-check",
          );
          setIsValidating(false);
          return;
        }

        hasChecked.current = true;

        // Only check steps that:
        // 1. Are automatable
        // 2. Have check functions
        // 3. Are not already completed (unless they failed with non-auth error)
        const autoCheckSteps = ["G-4", "G-5", "M-1", "M-6"];

        for (const stepId of autoCheckSteps) {
          const status = stepsStatus[stepId];

          // Skip if already successfully completed
          if (status?.status === "completed" && !status.metadata?.errorCode) {
            continue;
          }


          try {
            await executeCheck(stepId);
            // Add small delay between checks to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (error) {
            Logger.error("[Hook]", `Check failed for ${stepId}`, error);
            // Continue with other checks even if one fails
          }
        }
      } catch (error) {
        Logger.error("[Hook]", "Auto-check error", error);
      } finally {
        setIsValidating(false);
      }
    }, 2000);
  }, [appConfig, stepsStatus, session, status, executeCheck, isValidating]);

  // Trigger debounced check when dependencies change
  useEffect(() => {
    if (
      appConfig.domain &&
      appConfig.tenantId &&
      session?.hasGoogleAuth &&
      session?.hasMicrosoftAuth &&
      status === "authenticated"
    ) {
      debouncedCheck();
    }

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [
    appConfig.domain,
    appConfig.tenantId,
    session?.hasGoogleAuth,
    session?.hasMicrosoftAuth,
    status,
    debouncedCheck,
  ]);
}
