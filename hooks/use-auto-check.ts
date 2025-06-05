import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSelector } from "./use-redux";
import type { StepId } from "@/lib/steps/step-refs";
import type { StepCheckResult } from "@/lib/types";
import { debounce } from "@/lib/utils";
import { StepStatus } from "@/lib/constants/enums";
import { Logger } from "@/lib/utils/logger";

/**
 * Automatically checks step status when configuration is available.
 * Each step is only checked once per session unless manually refreshed.
 */
export function useAutoCheck(
  executeCheck: (stepId: StepId) => Promise<StepCheckResult>,
) {
  const domain = useAppSelector((state) => state.app.domain);
  const tenantId = useAppSelector((state) => state.app.tenantId);
  const stepsStatus = useAppSelector((state) => state.app.steps);

  const checkedSteps = useRef(new Set<StepId>());
  const isCheckingRef = useRef(false);
  const [isChecking, setIsChecking] = useState(false);

  const runChecks = useCallback(
    async (force = false) => {
      if (isCheckingRef.current) return;
      if (!domain || !tenantId) return;

      isCheckingRef.current = true;
      setIsChecking(true);

      const { allStepDefinitions } = await import("@/lib/steps");
      const checkableSteps = allStepDefinitions
        .filter((s) => s.check)
        .map((s) => s.id as StepId);

      for (const stepId of checkableSteps) {
        const status = Object.prototype.hasOwnProperty.call(stepsStatus, stepId)
          ? // eslint-disable-next-line security/detect-object-injection
            stepsStatus[stepId]
          : undefined;
        const lastChecked = status?.lastCheckedAt
          ? new Date(status.lastCheckedAt).getTime()
          : 0;
        const recentlyChecked = Date.now() - lastChecked < 30_000 && !force;
        const shouldCheck =
          force ||
          !checkedSteps.current.has(stepId) ||
          status?.status === StepStatus.FAILED ||
          status?.status === StepStatus.PENDING;

        if (shouldCheck && !recentlyChecked) {
          Logger.info('[AutoCheck]', `Checking step ${stepId}`);
          await executeCheck(stepId);

          // API logs are streamed via SSE; nothing to handle here

          checkedSteps.current.add(stepId);
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      isCheckingRef.current = false;
      setIsChecking(false);
    },
    [executeCheck, domain, tenantId, stepsStatus],
  );

  const debouncedRunChecks = useRef(debounce(() => runChecks(false), 5000));

  useEffect(() => {
    if (domain && tenantId) {
      debouncedRunChecks.current();
    }
  }, [domain, tenantId]);

  const manualRefresh = useCallback(async () => {
    checkedSteps.current.clear();
    await runChecks(true);
  }, [runChecks]);

  return { manualRefresh, isChecking };
}
