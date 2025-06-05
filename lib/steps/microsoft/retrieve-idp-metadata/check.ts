import { OUTPUT_KEYS } from "@/lib/types";
import { createStepCheck } from "../../utils/check-factory";

export const checkIdpMetadata = createStepCheck({
  requiredOutputs: [],
  checkLogic: async (context) => {
    const hasAll =
      context.outputs[OUTPUT_KEYS.IDP_CERTIFICATE_BASE64] &&
      context.outputs[OUTPUT_KEYS.IDP_SSO_URL] &&
      context.outputs[OUTPUT_KEYS.IDP_ENTITY_ID];
    return hasAll
      ? { completed: true, message: "Azure AD IdP metadata retrieved." }
      : { completed: false, message: "Azure AD IdP metadata not retrieved." };
  },
});
