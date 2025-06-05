import type { StepDefinition, StepInput, StepOutput } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkSamlProfileUpdate } from "./check";
import { executeUpdateSamlProfile } from "./execute";
import { STEP_IDS } from "@/lib/steps/step-refs";

export const G6_OUTPUTS: StepOutput[] = [];
export const G6_INPUTS: StepInput[] = [
  {
    type: "keyValue",
    data: {
      key: OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME,
      description: "Full name of the Google SAML profile",
      producedBy: STEP_IDS.INITIATE_SAML_PROFILE,
    },
    stepTitle: "Initiate Google SAML Profile",
  },
  {
    type: "keyValue",
    data: {
      key: OUTPUT_KEYS.IDP_ENTITY_ID,
      description: "Azure AD Entity ID",
      producedBy: STEP_IDS.RETRIEVE_IDP_METADATA,
    },
    stepTitle: "Retrieve Azure AD IdP Metadata",
  },
  {
    type: "keyValue",
    data: {
      key: OUTPUT_KEYS.IDP_SSO_URL,
      description: "Azure AD SSO URL",
      producedBy: STEP_IDS.RETRIEVE_IDP_METADATA,
    },
    stepTitle: "Retrieve Azure AD IdP Metadata",
  },
  {
    type: "keyValue",
    data: {
      key: OUTPUT_KEYS.IDP_CERTIFICATE_BASE64,
      description: "Azure AD signing certificate",
      producedBy: STEP_IDS.RETRIEVE_IDP_METADATA,
    },
    stepTitle: "Retrieve Azure AD IdP Metadata",
  },
];

export const g6UpdateSamlProfile: StepDefinition = {
  id: STEP_IDS.UPDATE_SAML_PROFILE,
  title: "Update Google SAML Profile with Azure AD IdP Info",
  description: "Connect Google to Microsoft using sign-on details",
  details:
    "Updates the Google SAML profile with metadata from Azure AD including entity ID, SSO URL, and certificate. This completes the trust relationship for SSO.",

  category: "SSO",
  activity: "SSO",
  provider: "Google",

  automatability: "automated",
  automatable: true,
  inputs: G6_INPUTS,
  outputs: G6_OUTPUTS,
  requires: [STEP_IDS.INITIATE_SAML_PROFILE, STEP_IDS.RETRIEVE_IDP_METADATA],
  nextStep: {
    id: STEP_IDS.ASSIGN_SAML_PROFILE,
    description: "Assign the SAML profile",
  },

  actions: ["PATCH /v1/inboundSamlSsoProfiles/{profile}"],
  adminUrls: {
    configure: portalUrls.google.sso.main(),
    verify: portalUrls.google.sso.main(),
  },
  check: checkSamlProfileUpdate,
  execute: executeUpdateSamlProfile,
};
