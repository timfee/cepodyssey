import { OUTPUT_KEYS } from "@/lib/types";
import { createStepCheck } from "../../utils/check-factory";
import { checkMicrosoftServicePrincipalEnabled } from "../utils/common-checks";

export const checkEnableProvisioningSp = createStepCheck({
  requiredOutputs: [OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID],
  checkLogic: async (context) => {
    const spId = context.outputs[
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID
    ] as string;
    const result = await checkMicrosoftServicePrincipalEnabled(spId);
    return result;
  },
});
