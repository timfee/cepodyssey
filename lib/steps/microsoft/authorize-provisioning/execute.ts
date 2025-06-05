import type { StepContext, StepExecutionResult } from '@/lib/types';
import { OUTPUT_KEYS } from '@/lib/types';
import { portalUrls } from '@/lib/api/url-builder';
import { STEP_IDS } from '@/lib/steps/step-refs';
import { withExecutionHandling } from '../../utils/execute-wrapper';

export const executeAuthorizeProvisioning = withExecutionHandling({
  stepId: STEP_IDS.AUTHORIZE_PROVISIONING,
  requiredOutputs: [OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID, OUTPUT_KEYS.PROVISIONING_APP_ID],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {
    const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as string;
    const appId = context.outputs[OUTPUT_KEYS.PROVISIONING_APP_ID] as string;
    const resourceUrl = portalUrls.azure.enterpriseApp.provisioning(spId, appId);

    return {
      success: true,
      message:
        "ACTION REQUIRED: In the Azure portal, open the provisioning app, click 'Authorize', and sign in with the Google provisioning user created in G-2. After testing the connection, mark this step complete.",
      outputs: { [OUTPUT_KEYS.FLAG_M3_PROV_CREDS_CONFIGURED]: true },
      resourceUrl,
    };
  },
});
