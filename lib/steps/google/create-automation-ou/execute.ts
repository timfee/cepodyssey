import * as google from '@/lib/api/google';
import type { StepContext, StepExecutionResult } from '@/lib/types';
import { OUTPUT_KEYS } from '@/lib/types';
import { portalUrls } from '@/lib/api/url-builder';
import { getGoogleToken } from '../../utils/auth';
import { STEP_IDS } from '@/lib/steps/step-refs';
import { withExecutionHandling } from '../../utils/execute-wrapper';

export const executeCreateAutomationOu = withExecutionHandling({
  stepId: STEP_IDS.CREATE_AUTOMATION_OU,
  requiredOutputs: [],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {
    const token = await getGoogleToken();
    const ouName = 'Automation';
    const parentPath = '/';

    const result = await google.createOrgUnit(
      token,
      ouName,
      parentPath,
      undefined,
      context.logger,
    );

    if ('alreadyExists' in result) {
      const existing = await google.getOrgUnit(
        token,
        `${parentPath}${ouName}`,
        context.logger,
      );
      if (existing?.orgUnitId && existing.orgUnitPath) {
        return {
          success: true,
          message: `Organizational Unit '${ouName}' already exists.`,
          outputs: {
            [OUTPUT_KEYS.AUTOMATION_OU_ID]: existing.orgUnitId,
            [OUTPUT_KEYS.AUTOMATION_OU_PATH]: existing.orgUnitPath,
          },
          resourceUrl: portalUrls.google.orgUnits.details(existing.orgUnitPath),
        };
      }
    }

    const created = result as google.GoogleOrgUnit;
    if (!created.orgUnitId || !created.orgUnitPath) {
      return {
        success: false,
        error: { message: 'Failed to create OU.', code: 'API_ERROR' },
      };
    }

    return {
      success: true,
      message: `Organizational Unit '${ouName}' created successfully.`,
      outputs: {
        [OUTPUT_KEYS.AUTOMATION_OU_ID]: created.orgUnitId,
        [OUTPUT_KEYS.AUTOMATION_OU_PATH]: created.orgUnitPath,
      },
      resourceUrl: portalUrls.google.orgUnits.details(created.orgUnitPath),
    };
  },
});
