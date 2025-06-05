import { createApiClient } from "../base/api-client";
import { wrapAuthError } from "../auth-interceptor";
import { createEnablementError, isAPIEnablementError } from "../api-enablement-error";
import { APIError } from "../utils";
import { getGoogleToken } from "../../steps/utils/auth";

function handleGoogleError(error: unknown): never {
  if (error instanceof APIError && (error.status === 401 || error.message?.includes("invalid authentication credentials"))) {
    throw wrapAuthError(error, "google");
  }
  if (error instanceof APIError && isAPIEnablementError(error)) {
    throw createEnablementError(error);
  }
  throw error;
}

export const googleApiClient = createApiClient({
  provider: 'google',
  getToken: getGoogleToken,
  handleProviderError: handleGoogleError,
});
