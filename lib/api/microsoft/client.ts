import { createApiClient } from "../base/api-client";
import { wrapAuthError } from "../auth-interceptor";
import { APIError } from "../utils";
import { getMicrosoftToken } from "../../steps/utils/auth";

function handleMicrosoftError(error: unknown): never {
  if (error instanceof APIError && error.status === 401) {
    throw wrapAuthError(error, "microsoft");
  }
  throw error;
}

export const microsoftApiClient = createApiClient({
  provider: 'microsoft',
  getToken: getMicrosoftToken,
  handleProviderError: handleMicrosoftError,
});
