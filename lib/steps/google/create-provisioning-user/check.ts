"use server";

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { getStepInputs, getStepOutputs } from "@/lib/steps/utils/io-mapping";
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
    return {
      completed: false,
      message: "Domain not configured.",
      outputs: {
        inputs: getStepInputs("G-2"),
        expectedOutputs: getStepOutputs("G-2"),
      },
    };
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
          producedOutputs: getStepOutputs("G-2").map((o) => ({
            ...o,
            value:
              o.key === OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL
                ? user.primaryEmail
                : user.id,
          })),
          inputs: getStepInputs("G-2").map((inp) => ({
            ...inp,
            data: { ...inp.data, value: context.outputs[inp.data.key!] },
          })),
        },
      };
    }

    return {
      completed: false,
      message: `Service account '${email}' not found.`,
      outputs: {
        inputs: getStepInputs("G-2"),
        expectedOutputs: getStepOutputs("G-2"),
      },
    };
  } catch (e) {
    if (e instanceof APIError && e.status === 404) {
      return {
        completed: false,
        message: `Service account 'azuread-provisioning@${context.domain}' not found.`,
        outputs: {
          inputs: getStepInputs("G-2"),
          expectedOutputs: getStepOutputs("G-2"),
        },
      };
    }
    return handleCheckError(e, "Couldn't verify service account existence.");
  }
}
