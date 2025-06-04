import type { StepDefinition } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkAttributeMappings } from "./check";
import { executeConfigureAttributeMappings } from "./execute";

export const m4ConfigureAttributeMappings: StepDefinition = {
  id: "M-4",
  title: "Configure Attribute Mappings (Provisioning)",
  description: "Set up how user data syncs between systems",
  category: "Microsoft",
  automatable: true,
  requires: ["M-3"],
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
  check: checkAttributeMappings,
  execute: executeConfigureAttributeMappings,
};
