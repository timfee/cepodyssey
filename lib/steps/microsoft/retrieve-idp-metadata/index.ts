import type { StepInput, StepOutput } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkIdpMetadata } from "./check";
import { executeRetrieveIdpMetadata } from "./execute";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "../../utils/step-factory";

export const M8_OUTPUTS: StepOutput[] = [
  { key: OUTPUT_KEYS.IDP_CERTIFICATE_BASE64, description: "IdP certificate" },
  { key: OUTPUT_KEYS.IDP_SSO_URL, description: "IdP SSO URL" },
  { key: OUTPUT_KEYS.IDP_ENTITY_ID, description: "IdP entity ID" },
];

export const M8_INPUTS: StepInput[] = [
  {
    type: "keyValue",
    data: {
      key: OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID,
      description: "SAML SP object ID",
      producedBy: STEP_IDS.CREATE_SAML_APP,
    },
    stepTitle: "Create SAML App",
  },
  {
    type: "keyValue",
    data: {
      key: OUTPUT_KEYS.SAML_SSO_APP_ID,
      description: "SAML app ID",
      producedBy: STEP_IDS.CREATE_SAML_APP,
    },
    stepTitle: "Create SAML App",
  },
];

export const m8RetrieveIdpMetadata = defineStep({
  id: STEP_IDS.RETRIEVE_IDP_METADATA,
  metadata: {
    title: "Retrieve Azure AD IdP SAML Metadata for Google",
    description: "Get Microsoft's sign-on details for Google",
    details:
      "Retrieves the Azure AD SAML metadata XML which includes the IdP entity ID, sign-in URL, and certificate. Google Workspace uses this data to trust Azure AD as the identity provider.",
    category: "Microsoft",
    activity: "SSO",
    provider: "Microsoft",
    automatability: "automated",
  },
  io: {
    inputs: M8_INPUTS,
    outputs: M8_OUTPUTS,
  },
  requires: [STEP_IDS.CONFIGURE_SAML_APP],
  nextStep: {
    id: STEP_IDS.ASSIGN_USERS_SSO,
    description: "Assign users to SSO app",
  },
  actions: ["GET /federationmetadata/2007-06/federationmetadata.xml"],
  urls: {
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
  handlers: { check: checkIdpMetadata, execute: executeRetrieveIdpMetadata },
});
