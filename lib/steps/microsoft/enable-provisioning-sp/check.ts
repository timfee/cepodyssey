import { OUTPUT_KEYS } from "@/lib/types";
import { createStepCheck } from "../../utils/check-factory";
import { checkMicrosoftServicePrincipalEnabled } from "../utils/common-checks";
import { getRequiredOutput } from "../../utils/get-output";

export const checkEnableProvisioningSp = createStepCheck({
  requiredOutputs: [OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID],
  checkLogic: async (context) => {

    const spId = getRequiredOutput<string>(
      context,
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
    );
    const result = await checkMicrosoftServicePrincipalEnabled(spId);

    return result;
  },
});
