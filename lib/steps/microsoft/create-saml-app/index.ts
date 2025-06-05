import type { StepDefinition, StepInput, StepOutput } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkCreateSamlApp } from "./check";
import { executeCreateSamlApp } from "./execute";
import { STEP_IDS } from "@/lib/steps/step-refs";

export const M6_OUTPUTS: StepOutput[] = [
  { key: OUTPUT_KEYS.SAML_SSO_APP_ID, description: "App (Client) ID" },
  {
    key: OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID,
    description: "Application Object ID",
  },
  {
    key: OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID,
    description: "Service Principal ID",
  },
];

export const M6_INPUTS: StepInput[] = [];

export const m6CreateSamlApp: StepDefinition = {
  id: STEP_IDS.CREATE_SAML_APP,
  title: "Create Azure AD Enterprise App for SAML SSO",
  description: "Add a second Google app for single sign-on",
  details:
    "Creates a second gallery application specifically for SAML-based single sign-on with Google Workspace. This generates a new application registration and service principal that will handle SSO requests.",

  category: "Microsoft",
  activity: "SSO",
  provider: "Microsoft",

  automatability: "automated",
  automatable: true,

  inputs: M6_INPUTS,
  outputs: M6_OUTPUTS,
  requires: [STEP_IDS.START_PROVISIONING],
  nextStep: {
    id: STEP_IDS.CONFIGURE_SAML_APP,
    description: "Configure SAML settings",
  },
  actions: ["POST /applicationTemplates/{templateId}/instantiate"],
  adminUrls: {
    configure: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.overview(
        spId as string,
        appId as string,
      );
    },
    verify: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.overview(
        spId as string,
        appId as string,
      );
    },
  },
  check: checkCreateSamlApp,
  execute: executeCreateSamlApp,
};
