import { OUTPUT_KEYS } from '@/lib/types';
import { STEP_IDS } from '@/lib/steps/step-refs';
import { createStepCheck } from '../../utils/check-factory';
import { checkMicrosoftAppAssignments } from '../utils/common-checks';

export const checkAssignUsers = createStepCheck({
  stepId: STEP_IDS.ASSIGN_USERS_SSO,
  requiredOutputs: [OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID],
  checkLogic: async (context) => {
    const spId = context.outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID] as string;
    const result = await checkMicrosoftAppAssignments(spId);
    return result;
  },
});
