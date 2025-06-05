import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "@/lib/steps/utils/step-factory";
import { Automatability } from "@/lib/constants/enums";
import { OUTPUT_KEYS } from "@/lib/types";
import { getOutputValue } from "../../utils/get-output";
import { checkCreateSamlApp } from "./check";
import { executeCreateSamlApp } from "./execute";

export const m6CreateSamlApp = defineStep({
  id: STEP_IDS.CREATE_SAML_APP,
  metadata: {
    title: "Create Azure AD Enterprise App for SAML SSO",
    description: "Add a second Google app for single sign-on",
    category: "Microsoft",
    activity: "SSO",
    provider: "Microsoft",
    automatability: Automatability.AUTOMATED,
    requires: [STEP_IDS.START_PROVISIONING],
  },
  io: {
    inputs: [],
    outputs: [
      { key: OUTPUT_KEYS.SAML_SSO_APP_ID, description: "App (Client) ID" },
      { key: OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID, description: "Application Object ID" },
      { key: OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID, description: "Service Principal ID" },
    ],
  },
  urls: {
    configure: (outputs) => {
      const spId = getOutputValue<string>(outputs, OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID);
      const appId = getOutputValue<string>(outputs, OUTPUT_KEYS.SAML_SSO_APP_ID);
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.overview(spId, appId);
    },
    verify: (outputs) => {
      const spId = getOutputValue<string>(outputs, OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID);
      const appId = getOutputValue<string>(outputs, OUTPUT_KEYS.SAML_SSO_APP_ID);
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.overview(spId, appId);
    },
  },
  handlers: { check: checkCreateSamlApp, execute: executeCreateSamlApp },
});
