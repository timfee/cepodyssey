import { OUTPUT_KEYS } from "@/lib/types";
import { createStepCheck } from "../../utils/check-factory";
import { checkMicrosoftAppAssignments } from "../utils/common-checks";
import { getRequiredOutput } from "../../utils/get-output";

export const checkAssignUsers = createStepCheck({
  requiredOutputs: [OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID],
  checkLogic: async (context) => {
    const spId = getRequiredOutput<string>(
      context,
      OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID,
    );
    const result = await checkMicrosoftAppAssignments(spId);

    return result;
  },
});
