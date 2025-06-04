import type { StepDefinition } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkStartProvisioning } from "./check";
import { executeStartProvisioning } from "./execute";

export const m5StartProvisioning: StepDefinition = {
  id: "M-5",
  title: "Define Scope & Start Provisioning Job",
  description: "Start syncing users (configure who to sync first)",
  details:
    "Defines which users and groups should be provisioned and then starts the synchronization job in Azure AD. The initial sync may take several minutes to complete.",

  category: "Microsoft",
  activity: "Provisioning",
  provider: "Microsoft",

  automatability: "supervised",
  automatable: true,
  requires: ["M-4"],
  nextStep: { id: "M-6", description: "Create SAML app for SSO" },
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
