import { expect } from "@jest/globals";

/**
 * Ensure auth error components can load without server-only environment variables.
 */
describe("auth error component environment", () => {
  it("imports without throwing", () => {
    expect(() => require("@/app/global-error")).not.toThrow();
    expect(() => require("@/components/auth-error-boundary")).not.toThrow();
  });
});
