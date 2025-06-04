"use server";
import type { StepCheckResult, StepContext } from "@/lib/types";
import { APIError } from "@/lib/api/utils";
import * as google from "@/lib/api/google";
import { getGoogleToken } from "../utils/auth";
import { handleCheckError } from "../../utils/error-handling";
import { getStepInputs, getStepOutputs } from "@/lib/steps/utils/io-mapping";

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
        inputs: getStepInputs("G-4"),
        expectedOutputs: getStepOutputs("G-4"),
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
            producedOutputs: getStepOutputs("G-4"),
            inputs: getStepInputs("G-4").map((inp) => ({
              ...inp,
              data: { ...inp.data, value: context.outputs[inp.data.key!] },
            })),
          }
        : {
            inputs: getStepInputs("G-4"),
            expectedOutputs: getStepOutputs("G-4"),
          },
    };
  } catch (e) {
    if (e instanceof APIError && e.status === 404) {
      return {
        completed: false,
        message: `Domain '${context.domain}' not found in Google Workspace.`,
        outputs: {
          inputs: getStepInputs("G-4"),
          expectedOutputs: getStepOutputs("G-4"),
        },
      };
    }
    return handleCheckError(
      e,
      `Couldn't verify domain verification for '${context.domain}'.`,
    );
  }
}
