import { OUTPUT_KEYS } from "@/lib/types";
import { createStepCheck } from "../../utils/check-factory";
import { checkMicrosoftSamlAppSettingsApplied } from "../utils/common-checks";
import { getRequiredOutput } from "../../utils/get-output";

export const checkConfigureSamlApp = createStepCheck({
  requiredOutputs: [
    OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID,
    OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID,
    OUTPUT_KEYS.GOOGLE_SAML_SP_ACS_URL,
  ],
  checkLogic: async (context) => {
    const appObjectId = getRequiredOutput<string>(
      context,
      OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID,
    );
    const spEntityId = getRequiredOutput<string>(
      context,
      OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID,
    );
    const acsUrl = getRequiredOutput<string>(
      context,
      OUTPUT_KEYS.GOOGLE_SAML_SP_ACS_URL,
    );
    const result = await checkMicrosoftSamlAppSettingsApplied(
      appObjectId,
      spEntityId,
      acsUrl,
      context.logger,
    );
    return result;
  },
});
