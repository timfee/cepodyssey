"use server";

import * as microsoft from "@/lib/api/microsoft";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { getTokens } from "../utils/auth";
import { handleExecutionError } from "../../utils/error-handling";
import { STEP_IDS } from "@/lib/steps/step-refs";

/**
 * Enable the provisioning service principal in Azure AD.
 */
export async function executeEnableProvisioningSp(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { microsoftToken } = await getTokens();
    const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as
      | string
      | undefined;
    const appId = context.outputs[OUTPUT_KEYS.PROVISIONING_APP_ID] as
      | string
      | undefined;
    if (!spId || !appId) {
      const missing = [] as string[];
      if (!spId) missing.push(OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID);
      if (!appId) missing.push(OUTPUT_KEYS.PROVISIONING_APP_ID);
      return {
        success: false,
        error: {
          message: `Missing required outputs: ${missing.join(", ")}. Ensure M-1 (Create Provisioning App) completed successfully.`,
          code: "MISSING_DEPENDENCY",
        },
      };
    }

    await microsoft.patchServicePrincipal(microsoftToken, spId, {
      accountEnabled: true,
    });

    return {
      success: true,
      message: "Provisioning app service principal enabled.",
      outputs: { [OUTPUT_KEYS.FLAG_M2_PROV_APP_PROPS_CONFIGURED]: true },
      resourceUrl: portalUrls.azure.enterpriseApp.overview(spId, appId),
    };
  } catch (e) {
    return handleExecutionError(e, STEP_IDS.ENABLE_PROVISIONING_SP);
  }
}
