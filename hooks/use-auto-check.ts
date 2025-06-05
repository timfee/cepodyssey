import { useCallback, useEffect, useRef } from "react";
import { useAppSelector } from "./use-redux";
import { Logger } from "@/lib/utils/logger";
import { STEP_IDS } from "@/lib/steps/step-refs";
import type { StepId } from "@/lib/steps/step-refs";

/**
 * Automatically runs step checks once configuration is available.
 * Only executes lightweight check functions for predefined steps.
 */
export function useAutoCheck(
  executeCheck: (stepId: StepId) => Promise<void>,
): void {
  const appConfig = useAppSelector((state) => state.appConfig);
  const stepsStatus = useAppSelector((state) => state.setupSteps.steps);
  const hasChecked = useRef(false);

  const runChecks = useCallback(async () => {
    if (hasChecked.current) return;
    if (!appConfig.domain || !appConfig.tenantId) return;

    hasChecked.current = true;
    Logger.info("[Hook]", "Running auto-checks for steps");

    const autoCheckSteps = [
      STEP_IDS.CREATE_AUTOMATION_OU,
      STEP_IDS.VERIFY_DOMAIN,
      STEP_IDS.INITIATE_SAML_PROFILE,
      STEP_IDS.CREATE_PROVISIONING_APP,
      STEP_IDS.CREATE_SAML_APP,
    ];

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
