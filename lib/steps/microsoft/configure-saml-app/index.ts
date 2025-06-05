import type { StepDefinition, StepInput, StepOutput } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkConfigureSamlApp } from "./check";
import { executeConfigureSamlApp } from "./execute";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { Automatability } from "@/lib/constants/enums";

export const M7_OUTPUTS: StepOutput[] = [
  {
    key: OUTPUT_KEYS.FLAG_M7_SAML_APP_SETTINGS_CONFIGURED,
    description: "SAML app settings configured",
  },
];

export const M7_INPUTS: StepInput[] = [
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
];

export const m7ConfigureSamlApp: StepDefinition = {
  id: STEP_IDS.CONFIGURE_SAML_APP,
  title: "Configure Azure AD SAML App for Google",
  description: "Configure single sign-on settings with Google's details",
  details:
    "Updates the SAML application with Google's ACS URL and entity ID and uploads the Azure AD signing certificate. This finalizes the SAML setup in Microsoft Entra ID.",

  category: "Microsoft",
  activity: "SSO",
  provider: "Microsoft",

  automatability: Automatability.MANUAL,
  automatable: true,

  inputs: M7_INPUTS,
  outputs: M7_OUTPUTS,
  requires: [STEP_IDS.CREATE_SAML_APP, STEP_IDS.INITIATE_SAML_PROFILE],
  nextStep: {
    id: STEP_IDS.RETRIEVE_IDP_METADATA,
    description: "Retrieve IdP metadata",
  },
  actions: ["Manual: Enter SAML settings in portal"],
  adminUrls: {
    configure: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.singleSignOn(
        spId as string,
        appId as string,
      );
    },
    verify: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.singleSignOn(
        spId as string,
        appId as string,
      );
    },
  },
  check: checkConfigureSamlApp,
  execute: executeConfigureSamlApp,
};
