import { validateSessionTokens } from "@/lib/api/session-validator";
import { SessionManager } from "@/lib/auth/utils/session-manager";

jest.mock("@/lib/auth/session-manager");

test("delegates to SessionManager.validate", async () => {
  const mockResult = { valid: true, googleValid: true, microsoftValid: true };
  (SessionManager.validate as jest.Mock).mockResolvedValue(mockResult);
  await expect(validateSessionTokens()).resolves.toBe(mockResult);
  expect(SessionManager.validate).toHaveBeenCalled();
});
