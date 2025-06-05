import { OUTPUT_KEYS } from "@/lib/types";
import { createStepCheck } from "../../utils/check-factory";
import { checkMicrosoftAppAssignments } from "../utils/common-checks";

export const checkAssignUsers = createStepCheck({
  requiredOutputs: [OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID],
  checkLogic: async (context) => {
    const spId = context.outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID] as string;
    const result = await checkMicrosoftAppAssignments(spId, context.logger);
    return result;
  },
});
