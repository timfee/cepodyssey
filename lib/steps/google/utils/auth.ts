"use server";

import { auth } from "@/app/(auth)/auth";
import { APIError } from "@/lib/api/utils";

export async function getGoogleToken(): Promise<string> {
  const session = await auth();
  if (!session?.googleToken) {
    throw new APIError(
      "Please sign in with Google",
      401,
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
      401,
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
      401,
      "GOOGLE_AUTH_REQUIRED",
    );
  }
  if (!session?.microsoftToken) {
    throw new APIError(
      "Microsoft authentication token is missing.",
      401,
      "MS_AUTH_REQUIRED",
    );
  }
  if (!session?.microsoftTenantId) {
    throw new APIError(
      "Microsoft tenant ID is missing from session.",
      401,
      "MS_TENANT_ID_REQUIRED",
    );
  }
  return {
    googleToken: session.googleToken,
    microsoftToken: session.microsoftToken,
    tenantId: session.microsoftTenantId,
  };
}
