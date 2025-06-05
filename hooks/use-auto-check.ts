import { useCallback, useEffect } from "react";
import { useAppSelector } from "./use-redux";
import { Logger } from "@/lib/utils/logger";
import type { StepId } from "@/lib/steps/step-refs";
import { allStepDefinitions } from "@/lib/steps";

/**
 * Automatically runs step checks when configuration is available.
 * Only executes for steps that have a check function defined.
 */
export function useAutoCheck(
  executeCheck: (stepId: StepId) => Promise<void>,
): void {
  const appConfig = useAppSelector((state) => state.appConfig);
  const stepsStatus = useAppSelector((state) => state.setupSteps.steps);

  const runChecks = useCallback(async () => {
    if (!appConfig.domain || !appConfig.tenantId) return;

    Logger.info("[Hook]", "Running auto-checks for checkable steps");

    // Get all checkable steps (those with a check function)
    const checkableSteps = allStepDefinitions
      .filter((step) => step.check !== undefined)
      .map((step) => step.id as StepId);

    for (const stepId of checkableSteps) {
      const status = stepsStatus[stepId];

      // Skip if already checking or in progress
      if (status?.status === "in_progress") {
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

  // Run checks whenever domain/tenantId changes or on mount
  useEffect(() => {
    if (appConfig.domain && appConfig.tenantId) {
      const timer = setTimeout(runChecks, 1000);
      return () => clearTimeout(timer);
    }
  }, [appConfig.domain, appConfig.tenantId, runChecks]);
}
