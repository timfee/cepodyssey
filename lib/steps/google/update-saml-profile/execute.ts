import * as google from '@/lib/api/google';
import type { StepContext, StepExecutionResult } from '@/lib/types';
import { OUTPUT_KEYS } from '@/lib/types';
import { portalUrls } from '@/lib/api/url-builder';
import { getGoogleToken } from '../../utils/auth';
import { STEP_IDS } from '@/lib/steps/step-refs';
import { withExecutionHandling } from '../../utils/execute-wrapper';

export const executeUpdateSamlProfile = withExecutionHandling({
  stepId: STEP_IDS.UPDATE_SAML_PROFILE,
  requiredOutputs: [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME, OUTPUT_KEYS.IDP_SSO_URL, OUTPUT_KEYS.IDP_ENTITY_ID, OUTPUT_KEYS.IDP_CERTIFICATE_BASE64],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {
    const token = await getGoogleToken();
    const profileName = context.outputs[OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME] as string;
    const idpSsoUrl = context.outputs[OUTPUT_KEYS.IDP_SSO_URL] as string;
    const idpEntityId = context.outputs[OUTPUT_KEYS.IDP_ENTITY_ID] as string;
    const cert = context.outputs[OUTPUT_KEYS.IDP_CERTIFICATE_BASE64] as string;

    await google.updateSamlProfile(
      token,
      profileName,
      {
        idpConfig: {
          entityId: idpEntityId,
          singleSignOnServiceUri: idpSsoUrl,
        },
      },
      context.logger,
    );

    await google.addIdpCredentials(token, profileName, cert, context.logger);

    return {
      success: true,
      message: 'Google SAML profile updated with Microsoft IdP info.',
      resourceUrl: portalUrls.google.sso.samlProfile(profileName),
    };
  },
});
