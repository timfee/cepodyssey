import * as google from '@/lib/api/google';
import type { StepContext, StepExecutionResult } from '@/lib/types';
import { OUTPUT_KEYS } from '@/lib/types';
import { portalUrls } from '@/lib/api/url-builder';
import { getGoogleToken } from '../../utils/auth';
import { STEP_IDS } from '@/lib/steps/step-refs';
import { withExecutionHandling } from '../../utils/execute-wrapper';

export const executeExcludeAutomationOu = withExecutionHandling({
  stepId: STEP_IDS.EXCLUDE_AUTOMATION_OU,
  requiredOutputs: [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {
    const token = await getGoogleToken();
    const profileFullName = context.outputs[
      OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME
    ] as string;

    await google.assignSamlToOrgUnits(
      token,
      profileFullName,
      [{ orgUnitId: '/Automation', ssoMode: 'SSO_OFF' }],
      context.logger,
    );

    return {
      success: true,
      message: "Automation OU excluded from SAML SSO.",
      resourceUrl: portalUrls.google.sso.main(),
    };
  },
});
