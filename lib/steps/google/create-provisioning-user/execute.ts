import * as google from '@/lib/api/google';
import type { StepContext, StepExecutionResult } from '@/lib/types';
import { OUTPUT_KEYS } from '@/lib/types';
import { portalUrls } from '@/lib/api/url-builder';
import { AlreadyExistsError } from '@/lib/api/errors';
import { getGoogleToken } from '../../utils/auth';
import { STEP_IDS } from '@/lib/steps/step-refs';
import { withExecutionHandling } from '../../utils/execute-wrapper';

export const executeCreateProvisioningUser = withExecutionHandling({
  stepId: STEP_IDS.CREATE_PROVISIONING_USER,
  requiredOutputs: [OUTPUT_KEYS.AUTOMATION_OU_PATH],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {
    const token = await getGoogleToken();
    const domain = context.domain;
    const ouPath = context.outputs[OUTPUT_KEYS.AUTOMATION_OU_PATH] as string;

    const email = `azuread-provisioning@${domain}`;
    const tempPassword = `P@${Date.now()}w0rd`;
    const user: google.DirectoryUser = {
      primaryEmail: email,
      name: { givenName: 'Microsoft Entra ID', familyName: 'Provisioning' },
      password: tempPassword,
      orgUnitPath: ouPath,
      changePasswordAtNextLogin: false,
    };

    let result: google.DirectoryUser;
    try {
      result = await google.createUser(token, user, context.logger);
    } catch (error) {
      if (error instanceof AlreadyExistsError) {
        const existing = await google.getUser(token, email, context.logger);
        if (existing?.primaryEmail && existing.id) {
          return {
            success: true,
            message: `User '${email}' already exists.`,
            outputs: {
              [OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL]: existing.primaryEmail,
              [OUTPUT_KEYS.SERVICE_ACCOUNT_ID]: existing.id,
            },
            resourceUrl: portalUrls.google.users.details(existing.primaryEmail),
          };
        }
        return { success: true, message: `User '${email}' already exists.` };
      }
      throw error;
    }

    if (!result.id || !result.primaryEmail) {
      return {
        success: false,
        error: {
          message: 'Failed to create provisioning user.',
          code: 'API_ERROR',
        },
      };
    }

    return {
      success: true,
      message: `User '${email}' created in OU '${ouPath}'.`,
      outputs: {
        [OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL]: result.primaryEmail,
        [OUTPUT_KEYS.SERVICE_ACCOUNT_ID]: result.id,
      },
      resourceUrl: portalUrls.google.users.details(result.primaryEmail),
    };
  },
});
