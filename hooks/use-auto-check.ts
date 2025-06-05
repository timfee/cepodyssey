import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSelector } from "./use-redux";
import type { StepId } from "@/lib/steps/step-refs";
import type { StepCheckResult } from "@/lib/types";
import { debounce } from "@/lib/utils";
import { store } from "@/lib/redux/store";
import { addApiLog } from "@/lib/redux/slices/debug-panel";

/**
 * Automatically checks step status when configuration is available.
 * Each step is only checked once per session unless manually refreshed.
 */
export function useAutoCheck(
  executeCheck: (stepId: StepId) => Promise<StepCheckResult>,
) {
  const appConfig = useAppSelector((state) => state.appConfig);
  const stepsStatus = useAppSelector((state) => state.setupSteps.steps);

  const checkedSteps = useRef(new Set<StepId>());
  const isCheckingRef = useRef(false);
  const [isChecking, setIsChecking] = useState(false);

  const runChecks = useCallback(
    async (force = false) => {
      if (isCheckingRef.current) return;
      if (!appConfig.domain || !appConfig.tenantId) return;

      isCheckingRef.current = true;
      setIsChecking(true);

      const { allStepDefinitions } = await import("@/lib/steps");
      const checkableSteps = allStepDefinitions
        .filter((s) => s.check)
        .map((s) => s.id as StepId);

      for (const stepId of checkableSteps) {
        const status = stepsStatus[stepId];
        const lastChecked = status?.lastCheckedAt
          ? new Date(status.lastCheckedAt).getTime()
          : 0;
        const recentlyChecked = Date.now() - lastChecked < 30_000 && !force;
        const shouldCheck =
          force ||
          !checkedSteps.current.has(stepId) ||
          status?.status === "failed" ||
          status?.status === "pending";

        if (shouldCheck && !recentlyChecked) {
          console.log(`[AutoCheck] Checking step ${stepId}`);
          const checkResult = await executeCheck(stepId);

          if (checkResult && "apiLogs" in checkResult && checkResult.apiLogs) {
            console.log(
              `[AutoCheck] Adding ${checkResult.apiLogs.length} API logs for step ${stepId}`,
            );
            checkResult.apiLogs.forEach((log) => {
              store.dispatch(addApiLog(log));
            });
          }

          checkedSteps.current.add(stepId);
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      isCheckingRef.current = false;
      setIsChecking(false);
    },
    [executeCheck, appConfig.domain, appConfig.tenantId, stepsStatus],
  );

  const debouncedRunChecks = useRef(debounce(() => runChecks(false), 5000));

  useEffect(() => {
    if (appConfig.domain && appConfig.tenantId) {
      debouncedRunChecks.current();
    }
  }, [appConfig.domain, appConfig.tenantId]);

  const manualRefresh = useCallback(async () => {
    checkedSteps.current.clear();
    await runChecks(true);
  }, [runChecks]);

  return { manualRefresh, isChecking };
}
