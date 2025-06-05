import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "@/lib/steps/utils/step-factory";
import { Automatability } from "@/lib/constants/enums";
import { OUTPUT_KEYS } from "@/lib/types";
import { getOutputValue } from "../../utils/get-output";
import { checkConfigureSamlApp } from "./check";
import { executeConfigureSamlApp } from "./execute";

export const m7ConfigureSamlApp = defineStep({
  id: STEP_IDS.CONFIGURE_SAML_APP,
  metadata: {
    title: "Configure Azure AD SAML App for Google",
    description: "Configure single sign-on settings with Google's details",
    category: "Microsoft",
    activity: "SSO",
    provider: "Microsoft",
    automatability: Automatability.MANUAL,
    requires: [STEP_IDS.CREATE_SAML_APP, STEP_IDS.INITIATE_SAML_PROFILE],
  },
  io: {
    inputs: [
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID,
          description: "Application Object ID",
          producedBy: STEP_IDS.CREATE_SAML_APP,
        },
        stepTitle: "Create SAML App",
      },
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID,
          description: "Service principal ID",
          producedBy: STEP_IDS.CREATE_SAML_APP,
        },
        stepTitle: "Create SAML App",
      },
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.SAML_SSO_APP_ID,
          description: "App (Client) ID",
          producedBy: STEP_IDS.CREATE_SAML_APP,
        },
        stepTitle: "Create SAML App",
      },
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID,
          description: "Google SP Entity ID",
          producedBy: STEP_IDS.INITIATE_SAML_PROFILE,
        },
        stepTitle: "Initiate Google SAML Profile",
      },
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.GOOGLE_SAML_SP_ACS_URL,
          description: "Google ACS URL",
          producedBy: STEP_IDS.INITIATE_SAML_PROFILE,
        },
        stepTitle: "Initiate Google SAML Profile",
      },
    ],
    outputs: [
      { key: OUTPUT_KEYS.FLAG_M7_SAML_APP_SETTINGS_CONFIGURED, description: "SAML app settings configured" },
    ],
  },
  urls: {
    configure: (outputs) => {
      const spId = getOutputValue<string>(outputs, OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID);
      const appId = getOutputValue<string>(outputs, OUTPUT_KEYS.SAML_SSO_APP_ID);
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.singleSignOn(spId, appId);
    },
    verify: (outputs) => {
      const spId = getOutputValue<string>(outputs, OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID);
      const appId = getOutputValue<string>(outputs, OUTPUT_KEYS.SAML_SSO_APP_ID);
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.singleSignOn(spId, appId);
    },
  },
  handlers: { check: checkConfigureSamlApp, execute: executeConfigureSamlApp },
});
