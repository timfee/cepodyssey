import { OUTPUT_KEYS } from "@/lib/types";
import { createStepCheck } from "../../utils/check-factory";

export const checkTestSso = createStepCheck({
  requiredOutputs: [],
  checkLogic: async (context) => {
    if (context.outputs[OUTPUT_KEYS.FLAG_M10_SSO_TESTED]) {
      return { completed: true, message: "SSO sign-in tested." };
    }
    return { completed: false, message: "Manual testing required." };
  },
});
