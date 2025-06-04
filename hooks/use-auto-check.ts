import { useCallback, useEffect, useRef } from "react";
import { useAppSelector } from "./use-redux";
import { Logger } from "@/lib/utils/logger";

/**
 * Automatically runs step checks once configuration is available.
 * Only executes lightweight check functions for predefined steps.
 */
export function useAutoCheck(
  executeCheck: (stepId: string) => Promise<void>,
): void {
  const appConfig = useAppSelector((state) => state.appConfig);
  const stepsStatus = useAppSelector((state) => state.setupSteps.steps);
  const hasChecked = useRef(false);

  const runChecks = useCallback(async () => {
    if (hasChecked.current) return;
    if (!appConfig.domain || !appConfig.tenantId) return;

    hasChecked.current = true;
    Logger.info("[Hook]", "Running auto-checks for steps");

    const autoCheckSteps = ["G-4", "G-5", "M-1", "M-6"];

    for (const stepId of autoCheckSteps) {
      const status = stepsStatus[stepId];

      if (status?.status === "completed") {
        continue;
      }

      try {
        await executeCheck(stepId);
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        Logger.error("[Hook]", `Check failed for ${stepId}`, error);
      }
    }
  }, [appConfig.domain, appConfig.tenantId, stepsStatus, executeCheck]);

  useEffect(() => {
    hasChecked.current = false;
  }, [appConfig.domain]);

  useEffect(() => {
    if (appConfig.domain && appConfig.tenantId) {
      const timer = setTimeout(runChecks, 1000);
      return () => clearTimeout(timer);
    }
  }, [appConfig.domain, appConfig.tenantId, runChecks]);
}
