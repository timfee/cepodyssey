import type { StepDefinition, StepInput, StepOutput } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkStartProvisioning } from "./check";
import { executeStartProvisioning } from "./execute";
import { STEP_IDS } from "@/lib/steps/step-refs";

export const M5_OUTPUTS: StepOutput[] = [];

export const M5_INPUTS: StepInput[] = [
  {
    type: "keyValue",
    data: {
      key: OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
      description: "Service principal object ID",
      producedBy: STEP_IDS.CREATE_PROVISIONING_APP,
    },
    stepTitle: "Create Provisioning App",
  },
  {
    type: "keyValue",
    data: {
      key: OUTPUT_KEYS.PROVISIONING_JOB_ID,
      description: "Provisioning job ID",
      producedBy: STEP_IDS.AUTHORIZE_PROVISIONING,
    },
    stepTitle: "Authorize Provisioning",
  },
  {
    type: "keyValue",
    data: {
      key: OUTPUT_KEYS.PROVISIONING_APP_ID,
      description: "Provisioning app ID",
      producedBy: STEP_IDS.CREATE_PROVISIONING_APP,
    },
    stepTitle: "Create Provisioning App",
  },
];

export const m5StartProvisioning: StepDefinition = {
  id: STEP_IDS.START_PROVISIONING,
  title: "Define Scope & Start Provisioning Job",
  description: "Start syncing users (configure who to sync first)",
  details:
    "Defines which users and groups should be provisioned and then starts the synchronization job in Azure AD. The initial sync may take several minutes to complete.",

  category: "Microsoft",
  activity: "Provisioning",
  provider: "Microsoft",

  automatability: "supervised",
  automatable: true,
  inputs: M5_INPUTS,
  outputs: M5_OUTPUTS,
  requires: [STEP_IDS.CONFIGURE_ATTRIBUTE_MAPPINGS],
  nextStep: {
    id: STEP_IDS.CREATE_SAML_APP,
    description: "Create SAML app for SSO",
  },
  actions: ["POST /servicePrincipals/{id}/synchronization/jobs"],
  adminUrls: {
    configure: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.provisioning(
        spId as string,
        appId as string,
      );
    },
    verify: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.provisioning(
        spId as string,
        appId as string,
      );
    },
  },
  check: checkStartProvisioning,
  execute: executeStartProvisioning,
};
