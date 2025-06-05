"use server";
import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { getStepInputs, getStepOutputs } from "@/lib/steps/registry";
import { STEP_IDS } from "@/lib/steps/step-refs";

export async function checkTestSso(
  context: StepContext,
): Promise<StepCheckResult> {
  if (context.outputs[OUTPUT_KEYS.FLAG_M10_SSO_TESTED]) {
    return {
      completed: true,
      message: "SSO sign-in tested.",
      outputs: {
        producedOutputs: getStepOutputs(STEP_IDS.TEST_SSO),
        inputs: getStepInputs(STEP_IDS.TEST_SSO).map((inp) => ({
          ...inp,
          data: { ...inp.data, value: context.outputs[inp.data.key!] },
        })),
      },
    };
  }
  return {
    completed: false,
    message: "Manual testing required.",
    outputs: {
      inputs: getStepInputs(STEP_IDS.TEST_SSO),
      expectedOutputs: getStepOutputs(STEP_IDS.TEST_SSO),
    },
  };
}
