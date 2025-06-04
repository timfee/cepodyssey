"use server";
import type { StepCheckResult, StepContext } from "@/lib/types";
import { checkGoogleSamlProfileDetails } from "@/app/actions/check-actions";

export async function checkSamlProfile(_context: StepContext): Promise<StepCheckResult> {
  return checkGoogleSamlProfileDetails("Azure AD SSO", true, undefined);
}
