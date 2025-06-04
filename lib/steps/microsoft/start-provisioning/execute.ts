"use server";

import * as microsoft from "@/lib/api/microsoft";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { getTokens } from "../utils/auth";
import { handleExecutionError } from "../utils/error-handling";

/**
 * Start the provisioning synchronization job in Azure AD.
 */
export async function executeStartProvisioning(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { microsoftToken } = await getTokens();
    const required = [
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
      OUTPUT_KEYS.PROVISIONING_JOB_ID,
      OUTPUT_KEYS.PROVISIONING_APP_ID,
    ];
    const missing = required.filter((k) => !context.outputs[k]);
    if (missing.length > 0) {
      return {
        success: false,
        error: {
          message: `Missing required outputs: ${missing.join(", ")}. Ensure M-4 (Configure Provisioning Attribute Mappings) completed successfully.`,
          code: "MISSING_DEPENDENCY",
        },
      };
    }
    const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as string;
    const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as string;
    const appId = context.outputs[OUTPUT_KEYS.PROVISIONING_APP_ID] as string;

    await microsoft.startProvisioningJob(microsoftToken, spId, jobId);

    return {
      success: true,
      message:
        "User provisioning job started. Monitor its progress in the Azure Portal. Ensure user/group scope for provisioning is correctly set in Azure.",
      resourceUrl: portalUrls.azure.enterpriseApp.provisioning(spId, appId),
    };
  } catch (e) {
    return handleExecutionError(e, "M-5");
  }
}
