import { OUTPUT_KEYS } from "@/lib/types";
import { createStepCheck } from "../../utils/check-factory";
import { checkMicrosoftServicePrincipal } from "../utils/common-checks";

export const checkProvisioningApp = createStepCheck({
  requiredOutputs: [OUTPUT_KEYS.PROVISIONING_APP_ID],
  checkLogic: async (context) => {
    const appId = context.outputs[OUTPUT_KEYS.PROVISIONING_APP_ID] as string;
    const result = await checkMicrosoftServicePrincipal(appId, context.logger);

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
