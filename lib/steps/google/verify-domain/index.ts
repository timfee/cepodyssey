import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "@/lib/steps/utils/step-factory";
import { Automatability } from "@/lib/constants/enums";
import { checkDomain } from "./check";
import { executeVerifyDomain } from "./execute";

export const g4VerifyDomain = defineStep({
  id: STEP_IDS.VERIFY_DOMAIN,
  metadata: {
    title: "Add & Verify Domain for Federation",
    description: "Verify your domain is ready for single sign-on",
    category: "Google",
    activity: "Foundation",
    provider: "Google",
    automatability: Automatability.SUPERVISED,
  },
  io: {
    inputs: [],
    outputs: [],
  },
  urls: {
    configure: portalUrls.google.domains.manage(),
    verify: portalUrls.google.domains.manage(),
  },
  handlers: { check: checkDomain, execute: executeVerifyDomain },
});
