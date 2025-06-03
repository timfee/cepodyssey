import { useEffect, useRef } from 'react';
import { useAppSelector } from './use-redux';

/**
 * Runs lightweight "check" functions for a subset of steps once the
 * application configuration becomes available. It calls the provided
 * `executeCheck` for each step that has not yet completed.
 */

export function useAutoCheck(executeCheck: (stepId: string) => Promise<void>) {
  const appConfig = useAppSelector((state) => state.appConfig);
  const stepsStatus = useAppSelector((state) => state.setupSteps.steps);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!appConfig.domain || !appConfig.tenantId || hasChecked.current) return;

    hasChecked.current = true;
    // Only run checks for steps that perform safe, read-only operations.
    const autoCheckSteps = [
      'G-1',  // Check OU exists
      'G-4',  // Domain verified
      'G-5',  // SAML profile exists
      'M-1',  // Provisioning app exists
      'M-6',  // SSO app exists
    ];
    // Don't auto-check these as they might have side effects:
    // M-2, M-7, M-8 - These might modify state

    const checkPromises = autoCheckSteps
      .filter((stepId) => {
        const status = stepsStatus[stepId];
        return !status || status.status === 'pending' || status.status === 'failed';
      })
      .map((id) => executeCheck(id));

    Promise.all(checkPromises).catch(console.error);
  }, [appConfig.domain, appConfig.tenantId, stepsStatus, executeCheck]);
}
