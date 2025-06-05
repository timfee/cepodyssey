import { OUTPUT_KEYS } from "@/lib/types";
import { createStepCheck } from "../../utils/check-factory";
import { checkMicrosoftSamlAppSettingsApplied } from "../utils/common-checks";

export const checkConfigureSamlApp = createStepCheck({
  requiredOutputs: [
    OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID,
    OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID,
    OUTPUT_KEYS.GOOGLE_SAML_SP_ACS_URL,
  ],
  checkLogic: async (context) => {
    const appObjectId = context.outputs[
      OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID
    ] as string;
    const spEntityId = context.outputs[
      OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID
    ] as string;
    const acsUrl = context.outputs[
      OUTPUT_KEYS.GOOGLE_SAML_SP_ACS_URL
    ] as string;
    const result = await checkMicrosoftSamlAppSettingsApplied(
      appObjectId,
      spEntityId,
      acsUrl,
    );
    return result;
  },
});
