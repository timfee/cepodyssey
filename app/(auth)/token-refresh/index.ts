import { googleOAuthUrls, microsoftAuthUrls } from "@/lib/api/url-builder";
import type { JWT } from "next-auth/jwt";
import { refreshTokenBase } from "./base-refresher";

export async function refreshGoogleToken(token: JWT): Promise<JWT> {
  return refreshTokenBase(token, {
    provider: "Google",
    url: googleOAuthUrls.token(),
    params: {
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: token.googleRefreshToken as string,
    },
    onSuccess: (t, refreshed) => {
      const data = refreshed as {
        access_token: string;
        expires_in: number;
        refresh_token?: string;
      };
      return {
        ...t,
        googleAccessToken: data.access_token,
        googleExpiresAt: Date.now() + data.expires_in * 1000,
        googleRefreshToken: data.refresh_token ?? t.googleRefreshToken,
        error: undefined,
      };
    },
    clear: {
      googleAccessToken: undefined,
      googleRefreshToken: undefined,
      googleExpiresAt: undefined,
    },
  });
}

export async function refreshMicrosoftToken(token: JWT): Promise<JWT> {
  const tenantForRefresh =
    token.microsoftTenantId || process.env.MICROSOFT_TENANT_ID || "common";
  return refreshTokenBase(token, {
    provider: "Microsoft",
    url: microsoftAuthUrls.token(tenantForRefresh),
    params: {
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: token.microsoftRefreshToken as string,
      scope: process.env.MICROSOFT_GRAPH_SCOPES!,
    },
    onSuccess: (t, refreshed) => {
      const data = refreshed as {
        access_token: string;
        expires_in: number;
        refresh_token?: string;
      };
      return {
        ...t,
        microsoftAccessToken: data.access_token,
        microsoftExpiresAt: Date.now() + data.expires_in * 1000,
        microsoftRefreshToken: data.refresh_token ?? t.microsoftRefreshToken,
        error: undefined,
      };
    },
    clear: {
      microsoftAccessToken: undefined,
      microsoftRefreshToken: undefined,
      microsoftExpiresAt: undefined,
    },
  });
}
