import { OUTPUT_KEYS } from "@/lib/types";
import { createStepCheck } from "../../utils/check-factory";
import { checkMicrosoftProvisioningJobDetails } from "../utils/common-checks";

export const checkAuthorizeProvisioning = createStepCheck({
  requiredOutputs: [OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID],
  checkLogic: async (context) => {
    const spId = context.outputs[
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID
    ] as string;
    const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as
      | string
      | undefined;
    if (jobId) {
      const result = await checkMicrosoftProvisioningJobDetails(spId, jobId);
      if (result.completed) {
        return {
          completed: true,
          message: result.message,
          outputs: result.outputs || {},
        };
      }
    }
    if (context.outputs[OUTPUT_KEYS.FLAG_M3_PROV_CREDS_CONFIGURED]) {
      return {
        completed: true,
        message: "Provisioning connection marked authorized.",
      };
    }
    return {
      completed: false,
      message: "Provisioning connection not yet authorized.",
    };
  },
});
