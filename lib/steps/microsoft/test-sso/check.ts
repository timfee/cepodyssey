"use server";
import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { getStepInputs, getStepOutputs } from "@/lib/steps/utils/io-mapping";

export async function checkTestSso(
  context: StepContext,
): Promise<StepCheckResult> {
  if (context.outputs[OUTPUT_KEYS.FLAG_M10_SSO_TESTED]) {
    return {
      completed: true,
      message: "SSO sign-in tested.",
      outputs: {
        producedOutputs: getStepOutputs("M-10"),
        inputs: getStepInputs("M-10").map((inp) => ({
          ...inp,
          data: { ...inp.data, value: context.outputs[inp.data.key!] },
        })),
      },
    };
  }
  return {
    completed: false,
    message: "Manual testing required.",
    outputs: { inputs: getStepInputs("M-10"), expectedOutputs: getStepOutputs("M-10") },
  };
}
