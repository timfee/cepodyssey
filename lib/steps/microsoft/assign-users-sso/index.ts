import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "@/lib/steps/utils/step-factory";
import { Automatability } from "@/lib/constants/enums";
import { OUTPUT_KEYS } from "@/lib/types";
import { getOutputValue } from "../../utils/get-output";
import { checkAssignUsers } from "./check";
import { executeAssignUsers } from "./execute";

export const m9AssignUsersSso = defineStep({
  id: STEP_IDS.ASSIGN_USERS_SSO,
  metadata: {
    title: "Assign Users/Groups to Azure AD SSO App",
    description: "Choose who can use single sign-on",
    category: "Microsoft",
    activity: "SSO",
    provider: "Microsoft",
    automatability: Automatability.MANUAL,
    requires: [STEP_IDS.CREATE_SAML_APP],
  },
  io: {
    inputs: [
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID,
          description: "SSO service principal ID",
          producedBy: STEP_IDS.CREATE_SAML_APP,
        },
        stepTitle: "Create SAML App",
      },
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.SAML_SSO_APP_ID,
          description: "SSO app ID",
          producedBy: STEP_IDS.CREATE_SAML_APP,
        },
        stepTitle: "Create SAML App",
      },
    ],
    outputs: [],
  },
  urls: {
    configure: (outputs) => {
      const spId = getOutputValue<string>(outputs, OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID);
      const appId = getOutputValue<string>(outputs, OUTPUT_KEYS.SAML_SSO_APP_ID);
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.usersAndGroups(spId, appId);
    },
    verify: (outputs) => {
      const spId = getOutputValue<string>(outputs, OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID);
      const appId = getOutputValue<string>(outputs, OUTPUT_KEYS.SAML_SSO_APP_ID);
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.usersAndGroups(spId, appId);
    },
  },
  handlers: { check: checkAssignUsers, execute: executeAssignUsers },
});
