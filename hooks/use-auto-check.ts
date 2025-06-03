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
      'G-1', // Check Automation OU exists
      'G-4', // Domain added/verified
      'G-5', // SAML profile present
      'M-1', // Provisioning app exists
      'M-2', // Provisioning SP enabled
      'M-6', // SSO app exists
      'M-7', // SAML settings applied
      'M-8', // IdP metadata retrieved
    ];

    const checkPromises = autoCheckSteps
      .filter((stepId) => {
        const status = stepsStatus[stepId];
        return !status || status.status === 'pending' || status.status === 'failed';
      })
      .map((id) => executeCheck(id));

    Promise.all(checkPromises).catch(console.error);
  }, [appConfig.domain, appConfig.tenantId, stepsStatus, executeCheck]);
}
