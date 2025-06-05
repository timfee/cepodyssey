"use server";

import * as google from "@/lib/api/google";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { getGoogleToken } from "../utils/auth";
import { handleExecutionError } from "../../utils/error-handling";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { validateRequiredOutputs } from "../../utils/validation";

/**
 * Assign the configured SAML profile to the Root OU in Google Workspace.
 */
export async function executeAssignSamlProfile(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const token = await getGoogleToken();
    const validation = validateRequiredOutputs(context, [
      OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME,
    ]);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    const profileFullName = context.outputs[
      OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME
    ] as string;
    await google.assignSamlToOrgUnits(token, profileFullName, [
      { orgUnitId: "/", ssoMode: "SAML_SSO_ENABLED" },
    ]);
    return {
      success: true,
      message:
        "SAML profile assigned to Root OU for all users. Specific assignments can be adjusted in Google Admin console.",
      resourceUrl: portalUrls.google.sso.main(),
    };
  } catch (e) {
    return handleExecutionError(e, STEP_IDS.ASSIGN_SAML_PROFILE);
  }
}
