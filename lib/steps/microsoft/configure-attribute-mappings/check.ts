import { OUTPUT_KEYS } from "@/lib/types";
import { createStepCheck } from "../../utils/check-factory";
import { checkMicrosoftAttributeMappingsApplied } from "../utils/common-checks";
import { getRequiredOutput } from "../../utils/get-output";

export const checkAttributeMappings = createStepCheck({
  requiredOutputs: [
    OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
    OUTPUT_KEYS.PROVISIONING_JOB_ID,
  ],
  checkLogic: async (context) => {
    const spId = getRequiredOutput<string>(
      context,
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
    );
    const jobId = getRequiredOutput<string>(context, OUTPUT_KEYS.PROVISIONING_JOB_ID);
    const result = await checkMicrosoftAttributeMappingsApplied(spId, jobId);

    return result;
  },
});
