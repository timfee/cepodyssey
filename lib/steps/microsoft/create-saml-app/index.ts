import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "@/lib/steps/utils/step-factory";
import { OUTPUT_KEYS } from "@/lib/types";
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
    automatability: "automated",
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
      const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.overview(spId as string, appId as string);
    },
    verify: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.overview(spId as string, appId as string);
    },
  },
  handlers: { check: checkCreateSamlApp, execute: executeCreateSamlApp },
});
