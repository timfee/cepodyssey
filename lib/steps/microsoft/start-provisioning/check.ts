import { OUTPUT_KEYS } from '@/lib/types';
import { createStepCheck } from '../../utils/check-factory';
import { checkMicrosoftProvisioningJobDetails } from '../utils/common-checks';

export const checkStartProvisioning = createStepCheck({
  requiredOutputs: [OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID, OUTPUT_KEYS.PROVISIONING_JOB_ID],
  checkLogic: async (context) => {
    const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as string;
    const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as string;
    const result = await checkMicrosoftProvisioningJobDetails(spId, jobId);
    if (result.completed && result.outputs?.provisioningJobState === 'Active') {
      return { completed: true, message: 'Provisioning job is active.' };
    }
    return { completed: false, message: 'Provisioning job is not active.' };
  },
});
