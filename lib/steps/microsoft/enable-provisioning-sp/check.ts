"use server";

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkMicrosoftServicePrincipalEnabled } from "@/app/actions/check-actions";

export async function checkEnableProvisioningSp(context: StepContext): Promise<StepCheckResult> {
  const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as string;
  if (!spId) {
    return { completed: false, message: "Service Principal ID not found." };
  }
  return checkMicrosoftServicePrincipalEnabled(spId);
}
