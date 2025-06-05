import { executeStepCheck } from "@/app/actions/step-actions";
import { auth } from "@/lib/auth";
import type { StepContext, StepDefinition } from "@/lib/types";
jest.mock("@/lib/steps", () => {
  const step: StepDefinition & { check: jest.Mock } = {
    id: "G-1",
    title: "Test step",
    description: "desc",
    details: "details",
    category: "Google",
    activity: "Provisioning",
    provider: "Google",
    automatability: "automated",
    automatable: true,
    check: jest.fn(async () => ({ completed: false, message: "not found" })),
  };
  return { __esModule: true, allStepDefinitions: [step], mockStep: step };
});

jest.mock("@/app/(auth)/auth");

describe("Step Actions", () => {
  describe("executeStepCheck", () => {
    it("should check if org unit exists", async () => {
      const context: StepContext = {
        domain: "example.com",
        tenantId: "test-tenant",
        outputs: {},
      };

      const result = await executeStepCheck("G-1", context);

      expect(result.completed).toBe(false);
      expect(result.message).toContain("not found");
    });

    it("should handle authentication errors", async () => {
      (auth as jest.Mock).mockResolvedValueOnce(null);

      const result = await executeStepCheck("G-1", {} as StepContext);

      expect(result.completed).toBe(false);
      expect(result.outputs?.errorCode).toBe("NO_SESSION");
    });

    it("should handle API errors gracefully", async () => {
      const { mockStep } = await import("@/lib/steps");
      (mockStep.check as jest.Mock).mockRejectedValueOnce(
        new Error("API rate limit exceeded")
      );

      const result = await executeStepCheck("G-1", {
        domain: "example.com",
        tenantId: "test-tenant",
        outputs: {},
      } as StepContext);

      expect(result.completed).toBe(false);
      expect(result.message).toContain("API rate limit exceeded");
    });
  });
});
