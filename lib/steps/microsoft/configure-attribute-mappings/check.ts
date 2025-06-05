import { OUTPUT_KEYS } from '@/lib/types';
import { STEP_IDS } from '@/lib/steps/step-refs';
import { createStepCheck } from '../../utils/check-factory';
import { checkMicrosoftAttributeMappingsApplied } from '../utils/common-checks';

export const checkAttributeMappings = createStepCheck({
  stepId: STEP_IDS.CONFIGURE_ATTRIBUTE_MAPPINGS,
  requiredOutputs: [OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID, OUTPUT_KEYS.PROVISIONING_JOB_ID],
  checkLogic: async (context) => {
    const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as string;
    const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as string;
    const result = await checkMicrosoftAttributeMappingsApplied(spId, jobId);
    return result;
  },
});
