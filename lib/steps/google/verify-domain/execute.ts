import * as google from '@/lib/api/google';
import type { StepContext, StepExecutionResult } from '@/lib/types';
import { OUTPUT_KEYS } from '@/lib/types';
import { portalUrls } from '@/lib/api/url-builder';
import { getGoogleToken } from '../../utils/auth';
import { STEP_IDS } from '@/lib/steps/step-refs';
import { withExecutionHandling } from '../../utils/execute-wrapper';

export const executeVerifyDomain = withExecutionHandling({
  stepId: STEP_IDS.VERIFY_DOMAIN,
  requiredOutputs: [],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {
    const token = await getGoogleToken();

    const validation = validateRequiredOutputs(context, []);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    const user = await google.getLoggedInUser(token);
    const result = await google.addDomain(token, context.domain);
    if (typeof result === "object" && "alreadyExists" in result) {
      return {
        success: true,
        message: `Domain '${context.domain}' was already added/exists in Google Workspace.`,
        resourceUrl: portalUrls.google.domains.manage(context.domain),
        outputs: { [OUTPUT_KEYS.GOOGLE_CUSTOMER_ID]: user.customerId },
      };
    }


    return {
      success: true,
      message: `Domain '${context.domain}' added. Please ensure it is verified in your Google Workspace Admin console for SAML SSO.`,
      resourceUrl: portalUrls.google.domains.manage(context.domain),
      outputs: { [OUTPUT_KEYS.GOOGLE_CUSTOMER_ID]: user.customerId },
    };
  },
});
