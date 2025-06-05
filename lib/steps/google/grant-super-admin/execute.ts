import * as google from '@/lib/api/google';
import type { StepContext, StepExecutionResult } from '@/lib/types';
import { OUTPUT_KEYS } from '@/lib/types';
import { portalUrls } from '@/lib/api/url-builder';
import { getGoogleToken } from '../../utils/auth';
import { STEP_IDS } from '@/lib/steps/step-refs';
import { withExecutionHandling } from '../../utils/execute-wrapper';

export const executeGrantSuperAdmin = withExecutionHandling({
  stepId: STEP_IDS.GRANT_SUPER_ADMIN,
  requiredOutputs: [OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {
    const token = await getGoogleToken();
    const email = context.outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL] as string;

    const user = await google.getUser(token, email, context.logger);
    if (user?.isAdmin) {
      return {
        success: true,
        message: `User '${email}' is already an admin.`,
        outputs: { [OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID]: '3' },
        resourceUrl: portalUrls.google.users.details(email),
      };
    }
    const roles = await google.listRoleAssignments(token, email, context.logger);
    if (roles.some((r) => r.roleId === '3')) {
      return {
        success: true,
        message: `User '${email}' already has Super Admin role.`,
        outputs: { [OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID]: '3' },
        resourceUrl: portalUrls.google.users.details(email),
      };
    }
    await google.assignAdminRole(token, email, '3', undefined, context.logger);
    return {
      success: true,
      message: `Super Admin role assigned to '${email}'.`,
      outputs: { [OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID]: '3' },
      resourceUrl: portalUrls.google.users.details(email),
    };
  },
});
