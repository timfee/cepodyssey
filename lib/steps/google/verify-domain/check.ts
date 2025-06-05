"use server";
import type { StepCheckResult, StepContext } from "@/lib/types";
import { APIError } from "@/lib/api/utils";
import * as google from "@/lib/api/google";
import { getGoogleToken } from "../utils/auth";
import { handleCheckError } from "../../utils/error-handling";
import { getStepInputs, getStepOutputs } from "@/lib/steps/registry";
import { STEP_IDS } from "@/lib/steps/step-refs";

/**
 * Determine whether the primary domain is verified in Google Workspace.
 */
export async function checkDomain(
  context: StepContext,
): Promise<StepCheckResult> {
  if (!context.domain) {
    return {
      completed: false,
      message: "Domain not configured.",
      outputs: {
        inputs: getStepInputs(STEP_IDS.VERIFY_DOMAIN),
        expectedOutputs: getStepOutputs(STEP_IDS.VERIFY_DOMAIN),
      },
    };
  }

  try {
    const token = await getGoogleToken();
    const domainDetails = await google.getDomain(token, context.domain);
    const isVerified = !!(
      typeof domainDetails === "object" &&
      domainDetails &&
      "verified" in domainDetails &&
      domainDetails.verified
    );
    return {
      completed: isVerified,
      message: isVerified
        ? `Domain '${context.domain}' is verified.`
        : `Domain '${context.domain}' is not verified or not found. Verification is required for SAML SSO.`,
      outputs: isVerified
        ? {
            producedOutputs: getStepOutputs(STEP_IDS.VERIFY_DOMAIN),
            inputs: getStepInputs(STEP_IDS.VERIFY_DOMAIN).map((inp) => ({
              ...inp,
              data: { ...inp.data, value: context.outputs[inp.data.key!] },
            })),
          }
        : {
            inputs: getStepInputs(STEP_IDS.VERIFY_DOMAIN),
            expectedOutputs: getStepOutputs(STEP_IDS.VERIFY_DOMAIN),
          },
    };
  } catch (e) {
    if (e instanceof APIError && e.status === 404) {
      return {
        completed: false,
        message: `Domain '${context.domain}' not found in Google Workspace.`,
        outputs: {
          inputs: getStepInputs(STEP_IDS.VERIFY_DOMAIN),
          expectedOutputs: getStepOutputs(STEP_IDS.VERIFY_DOMAIN),
        },
      };
    }
    return handleCheckError(
      e,
      `Couldn't verify domain verification for '${context.domain}'.`,
    );
  }
}
