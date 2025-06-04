"use server";

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { APIError } from "@/lib/api/utils";
import * as google from "@/lib/api/google";
import { getGoogleToken } from "../utils/auth";
import { handleCheckError } from "../utils/error-handling";

/**
 * Verify the provisioning user exists in Google Workspace.
 * The user is expected to be named `azuread-provisioning@<domain>`.
 */
export async function checkProvisioningUser(
  context: StepContext,
): Promise<StepCheckResult> {
  if (!context.domain) {
    return { completed: false, message: "Domain not configured." };
  }

  try {
    const token = await getGoogleToken();
    const email = `azuread-provisioning@${context.domain}`;
    const user = await google.getUser(token, email);

    if (user?.primaryEmail) {
      return {
        completed: true,
        message: `Service account '${email}' exists.`,
        outputs: {
          [OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL]: user.primaryEmail,
          [OUTPUT_KEYS.SERVICE_ACCOUNT_ID]: user.id,
        },
      };
    }

    return {
      completed: false,
      message: `Service account '${email}' not found.`,
    };
  } catch (e) {
    if (e instanceof APIError && e.status === 404) {
      return {
        completed: false,
        message: `Service account 'azuread-provisioning@${context.domain}' not found.`,
      };
    }
    return handleCheckError(e, "Failed to check service account existence.");
  }
}
