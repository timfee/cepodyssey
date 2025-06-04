import type { StepDefinition } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkStartProvisioning } from "./check";
import { executeStartProvisioning } from "./execute";

export const m5StartProvisioning: StepDefinition = {
  id: "M-5",
  title: "Define Scope & Start Provisioning Job",
  description:
    "This action starts the Azure AD provisioning job. IMPORTANT: Before starting, manually configure the provisioning scope (which users/groups to sync) in the Azure Portal for the 'Google Workspace User Provisioning' app.",
  category: "Microsoft",
  automatable: true,
  requires: ["M-4"],
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
