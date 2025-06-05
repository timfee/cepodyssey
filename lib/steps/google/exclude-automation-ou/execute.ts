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
 * Disable SSO for the Automation OU if it exists.
 */
export async function executeExcludeAutomationOu(
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
    const automationOu = await google.getOrgUnit(token, "/Automation");
    if (!automationOu?.orgUnitId) {
      return {
        success: true,
        message:
          "No Automation OU found. This step is optional if no dedicated OU exists.",
      };
    }
    await google.assignSamlToOrgUnits(token, profileFullName, [
      { orgUnitId: automationOu.orgUnitId, ssoMode: "SSO_OFF" },
    ]);
    return {
      success: true,
      message: `SAML explicitly disabled for the 'Automation' OU (${automationOu.orgUnitPath}).`,
      resourceUrl: portalUrls.google.sso.main(),
    };
  } catch (e) {
    return handleExecutionError(e, STEP_IDS.EXCLUDE_AUTOMATION_OU);
  }
}
