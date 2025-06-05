import { OUTPUT_KEYS } from '@/lib/types';
import { createStepCheck } from '../../utils/check-factory';
import { checkMicrosoftServicePrincipal } from '../utils/common-checks';

export const checkCreateSamlApp = createStepCheck({
  requiredOutputs: [OUTPUT_KEYS.SAML_SSO_APP_ID],
  checkLogic: async (context) => {
    const appId = context.outputs[OUTPUT_KEYS.SAML_SSO_APP_ID] as string;
    const result = await checkMicrosoftServicePrincipal(appId);
    if (result.completed && result.outputs) {
      return {
        completed: true,
        message: result.message,
        outputs: {
          [OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID]: result.outputs.spId,
          [OUTPUT_KEYS.SAML_SSO_APP_ID]: result.outputs.retrievedAppId,
          [OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID]: result.outputs.appObjectId,
          resourceUrl: result.outputs.resourceUrl,
        },
      };
    }
    return result;
  },
});
