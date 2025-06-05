import { OUTPUT_KEYS } from "@/lib/types";
import { createStepCheck } from "../../utils/check-factory";
import { checkMicrosoftServicePrincipal } from "../utils/common-checks";
import { getRequiredOutput } from "../../utils/get-output";

export const checkProvisioningApp = createStepCheck({
  requiredOutputs: [OUTPUT_KEYS.PROVISIONING_APP_ID],
  checkLogic: async (context) => {
    const appId = getRequiredOutput<string>(
      context,
      OUTPUT_KEYS.PROVISIONING_APP_ID,
    );
    const result = await checkMicrosoftServicePrincipal(appId);

    if (result.completed && result.outputs) {
      return {
        completed: true,
        message: result.message,
        outputs: {
          [OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID]: result.outputs.spId,
          [OUTPUT_KEYS.PROVISIONING_APP_ID]: result.outputs.retrievedAppId,
          [OUTPUT_KEYS.PROVISIONING_APP_OBJECT_ID]: result.outputs.appObjectId,
          resourceUrl: result.outputs.resourceUrl,
        },
      };
    }
    return result;
  },
});
