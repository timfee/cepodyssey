import type { StepContext, StepExecutionResult } from '@/lib/types';
import { OUTPUT_KEYS } from '@/lib/types';
import { portalUrls } from '@/lib/api/url-builder';
import { STEP_IDS } from '@/lib/steps/step-refs';
import { withExecutionHandling } from '../../utils/execute-wrapper';

export const executeAssignUsers = withExecutionHandling({
  stepId: STEP_IDS.ASSIGN_USERS_SSO,
  requiredOutputs: [OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID, OUTPUT_KEYS.SAML_SSO_APP_ID],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {
    const spId = context.outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID] as string;
    const appId = context.outputs[OUTPUT_KEYS.SAML_SSO_APP_ID] as string;
    return {
      success: true,
      message: 'Assign users or groups to the SAML app in Azure Portal.',
      resourceUrl: portalUrls.azure.enterpriseApp.usersAndGroups(spId, appId),
    };
  },
});
