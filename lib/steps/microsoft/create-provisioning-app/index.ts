import type { StepDefinition, StepInput, StepOutput } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkProvisioningApp } from "./check";
import { executeCreateProvisioningApp } from "./execute";
import { STEP_IDS } from "@/lib/steps/step-refs";

export const M1_OUTPUTS: StepOutput[] = [
  { key: OUTPUT_KEYS.PROVISIONING_APP_ID, description: "App (Client) ID" },
  {
    key: OUTPUT_KEYS.PROVISIONING_APP_OBJECT_ID,
    description: "Application Object ID",
  },
  {
    key: OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
    description: "Service Principal Object ID",
  },
];

export const M1_INPUTS: StepInput[] = [];

export const m1CreateProvisioningApp: StepDefinition = {
  id: STEP_IDS.CREATE_PROVISIONING_APP,
  title: "Create Azure AD Enterprise App for Provisioning",
  description: "Add Google sync app from Microsoft's gallery",
  details:
    "Instantiates the Google Cloud/G Suite Connector by Microsoft gallery app. This creates an app registration and service principal used for provisioning users to Google Workspace.",

  category: "Microsoft",
  activity: "Provisioning",
  provider: "Microsoft",

  automatability: "automated",
  automatable: true,

  inputs: M1_INPUTS,
  outputs: M1_OUTPUTS,
  requires: [],
  nextStep: {
    id: STEP_IDS.ENABLE_PROVISIONING_SP,
    description: "Enable the service principal",
  },
  actions: ["POST /applicationTemplates/{templateId}/instantiate"],
  adminUrls: {
    configure: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.overview(
        spId as string,
        appId as string,
      );
    },
    verify: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.overview(
        spId as string,
        appId as string,
      );
    },
  },
  check: checkProvisioningApp,
  execute: executeCreateProvisioningApp,
};
