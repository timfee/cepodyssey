"use server";

import { auth } from "@/app/(auth)/auth";
import { APIError } from "@/lib/api/utils";

const HTTP_STATUS_UNAUTHORIZED = 401;

export async function getGoogleToken(): Promise<string> {
  const session = await auth();
  if (!session?.googleToken) {
    throw new APIError(
      "Please sign in with Google",
      HTTP_STATUS_UNAUTHORIZED,
      "GOOGLE_AUTH_REQUIRED",
    );
  }
  return session.googleToken;
}

export async function getMicrosoftToken(): Promise<string> {
  const session = await auth();
  if (!session?.microsoftToken) {
    throw new APIError(
      "Please sign in with Microsoft",
      HTTP_STATUS_UNAUTHORIZED,
      "MS_AUTH_REQUIRED",
    );
  }
  return session.microsoftToken;
}

export async function getTokens(): Promise<{
  googleToken: string;
  microsoftToken: string;
  tenantId: string;
}> {
  const session = await auth();
  if (!session?.googleToken) {
    throw new APIError(
      "Google authentication token is missing.",
      HTTP_STATUS_UNAUTHORIZED,
      "GOOGLE_AUTH_REQUIRED",
    );
  }
  if (!session?.microsoftToken) {
    throw new APIError(
      "Microsoft authentication token is missing.",
      HTTP_STATUS_UNAUTHORIZED,
      "MS_AUTH_REQUIRED",
    );
  }
  if (!session?.microsoftTenantId) {
    throw new APIError(
      "Microsoft tenant ID is missing from session.",
      HTTP_STATUS_UNAUTHORIZED,
      "MS_TENANT_ID_REQUIRED",
    );
  }
  return {
    googleToken: session.googleToken,
    microsoftToken: session.microsoftToken,
    tenantId: session.microsoftTenantId,
  };
}
