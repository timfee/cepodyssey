"use server";

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkMicrosoftAppAssignments } from "@/app/actions/check-actions";

export async function checkAssignUsers(context: StepContext): Promise<StepCheckResult> {
  const spId = context.outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID] as string;
  if (!spId) {
    return { completed: false, message: "SAML SSO SP ID not found." };
  }
  return checkMicrosoftAppAssignments(spId);
}
