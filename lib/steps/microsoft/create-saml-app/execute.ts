import type { StepContext, StepExecutionResult } from '@/lib/types';
import { portalUrls } from '@/lib/api/url-builder';
import { STEP_IDS } from '@/lib/steps/step-refs';
import { withExecutionHandling } from '../../utils/execute-wrapper';

export const executeCreateSamlApp = withExecutionHandling({
  stepId: STEP_IDS.CREATE_SAML_APP,
  requiredOutputs: [],
  executeLogic: async (_context: StepContext): Promise<StepExecutionResult> => {
    return {
      success: true,
      message: 'Create the Azure AD SAML SSO app manually in the Azure portal.',
      resourceUrl: portalUrls.azure.myApps(),
    };
  },
});
