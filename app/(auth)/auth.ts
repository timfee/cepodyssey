import { withRetry } from "@/lib/api/utils";
import { googleOAuthUrls, microsoftAuthUrls } from "@/lib/api/url-builder";
import { Logger } from "@/lib/utils/logger";
import type { User } from "next-auth";
import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import GoogleProvider, { type GoogleProfile } from "next-auth/providers/google";
import MicrosoftEntraIDProvider, {
  type MicrosoftEntraIDProfile,
} from "next-auth/providers/microsoft-entra-id";

const ADMIN_USER_KEY = "admin-user";
const accountStore = new Map<string, JWT>();

/**
 * Derive a stable key for storing the current user's tokens.
 * Multi-user support is not implemented, so a constant key is used.
 */
function getUserKey(_userOrToken?: User | JWT): string {
  return ADMIN_USER_KEY;
}

/**
 * Refresh an expired Google access token using the stored refresh token.
 * Returns a token object with updated expiry or marks the token invalid on
 * failure.
 */
async function refreshGoogleToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(googleOAuthUrls.token(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.googleRefreshToken as string,
      }),
    });
    const refreshed = await response.json();
    if (!response.ok) {
      Logger.error("[Auth]", "Google token refresh API error", refreshed);
      throw refreshed;
    }
    return {
      ...token,
      googleAccessToken: refreshed.access_token,
      googleExpiresAt: Date.now() + refreshed.expires_in * 1000,
      googleRefreshToken: refreshed.refresh_token ?? token.googleRefreshToken,
      error: undefined,
    };
  } catch (error) {
    Logger.error("[Auth]", "Exception during Google token refresh", error);
    return {
      ...token,
      googleAccessToken: undefined,
      googleRefreshToken: undefined,
      googleExpiresAt: undefined,
      error: "RefreshTokenError",
    };
  }
}

/**
 * Refresh an expired Microsoft access token using the stored refresh token.
 * Attempts the tenant associated with the token before falling back to the
 * configured default.
 */
async function refreshMicrosoftToken(token: JWT): Promise<JWT> {
  try {
    const tenantForRefresh =
      token.microsoftTenantId || process.env.MICROSOFT_TENANT_ID || "common";
    const response = await fetch(microsoftAuthUrls.token(tenantForRefresh), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.microsoftRefreshToken as string,
        scope: process.env.MICROSOFT_GRAPH_SCOPES!,
      }),
    });
    const refreshed = await response.json();
    if (!response.ok) {
      Logger.error("[Auth]", "Microsoft token refresh API error", refreshed);
      throw refreshed;
    }
    return {
      ...token,
      microsoftAccessToken: refreshed.access_token,
      microsoftExpiresAt: Date.now() + refreshed.expires_in * 1000,
      microsoftRefreshToken:
        refreshed.refresh_token ?? token.microsoftRefreshToken,
      error: undefined,
    };
  } catch (error) {
    Logger.error("[Auth]", "Exception during Microsoft token refresh", error);
    return {
      ...token,
      microsoftAccessToken: undefined,
      microsoftRefreshToken: undefined,
      microsoftExpiresAt: undefined,
      error: "RefreshTokenError",
    };
  }
}

export async function validateTokenPresence(token: JWT): Promise<{
  valid: boolean;
  missingTokens: ("google" | "microsoft")[];
  error?: string;
}> {
  const missingTokens: ("google" | "microsoft")[] = [];
  if (!token.googleAccessToken || token.googleAccessToken === "undefined") {
    missingTokens.push("google");
  }
  if (
    !token.microsoftAccessToken ||
    token.microsoftAccessToken === "undefined"
  ) {
    missingTokens.push("microsoft");
  }
  return {
    valid: missingTokens.length === 0,
    missingTokens,
    error: missingTokens.length > 0 ? "MISSING_TOKENS" : undefined,
  };
}

/**
 * Validate that the Google account is a Super Administrator and not suspended.
 * Returns `false` when API errors occur or the user lacks sufficient rights.
 */
async function checkGoogleAdmin(
  accessToken: string,
  email?: string | null,
): Promise<boolean> {
  if (!email || !accessToken) {
    Logger.warn("[Auth]", "checkGoogleAdmin: Email or accessToken missing.");
    return false;
  }
  const fetchUrl = `${
    process.env.GOOGLE_API_BASE
  }/admin/directory/v1/users/${encodeURIComponent(
    email,
  )}?fields=isAdmin,suspended,primaryEmail`;

  Logger.debug(
    "[Auth]",
    `checkGoogleAdmin: Fetching admin status for ${email} from ${fetchUrl}`,
  );
  try {
    const res = await withRetry(() =>
      fetch(fetchUrl, { headers: { Authorization: `Bearer ${accessToken}` } }),
    );

    const responseBodyForLogging = await res.clone().text();
    Logger.debug(
      "[Auth]",
      `checkGoogleAdmin: API response status: ${res.status}, body: ${responseBodyForLogging}`,
    );

    if (!res.ok) {
      Logger.warn(
        "[Auth]",
        `checkGoogleAdmin: API call failed with status ${res.status}. User: ${email}`,
      );
      try {
        const errorData = JSON.parse(responseBodyForLogging);
        Logger.warn("[Auth]", "checkGoogleAdmin: API error data", errorData);
      } catch {
        Logger.warn(
          "[Auth]",
          "checkGoogleAdmin: Could not parse error JSON from API.",
        );
      }
      return false;
    }
    const data = JSON.parse(responseBodyForLogging) as {
      isAdmin?: boolean;
      suspended?: boolean;
      primaryEmail?: string;
    };
    Logger.debug(
      "[Auth]",
      `checkGoogleAdmin: Parsed API response data for ${email}:`,
      data,
    );

    const isSuperAdmin = data.isAdmin === true && data.suspended === false;
    Logger.debug(
      "[Auth]",
      `checkGoogleAdmin: User ${email}, isAdmin: ${data.isAdmin}, suspended: ${data.suspended}, Determined SuperAdmin: ${isSuperAdmin}`,
    );
    return isSuperAdmin;
  } catch (err) {
    Logger.error(
      "[Auth]",
      `checkGoogleAdmin: Exception while verifying Google admin status for ${email}`,
      err,
    );
    return false;
  }
}

/**
 * Determine if the Microsoft account is a Global Administrator.
 * Returns `false` when API access fails or the role isn't present.
 */
async function checkMicrosoftAdmin(accessToken: string): Promise<boolean> {
  if (!accessToken) {
    Logger.warn("[Auth]", "checkMicrosoftAdmin: AccessToken missing.");
    return false;
  }
  const fetchUrl = `${process.env.GRAPH_API_BASE}/me/memberOf/microsoft.graph.directoryRole?$select=displayName,roleTemplateId`;
  Logger.debug(
    "[Auth]",
    `checkMicrosoftAdmin: Fetching admin roles from ${fetchUrl}`,
  );
  try {
    const res = await withRetry(() =>
      fetch(fetchUrl, { headers: { Authorization: `Bearer ${accessToken}` } }),
    );

    const responseBodyForLogging = await res.clone().text();
    Logger.debug(
      "[Auth]",
      `checkMicrosoftAdmin: API response status: ${res.status}, body: ${responseBodyForLogging}`,
    );

    if (!res.ok) {
      Logger.warn(
        "[Auth]",
        `checkMicrosoftAdmin: API call failed with status ${res.status}.`,
      );
      try {
        const errorData = JSON.parse(responseBodyForLogging);
        Logger.warn("[Auth]", "checkMicrosoftAdmin: API error data", errorData);
      } catch {
        Logger.warn(
          "[Auth]",
          "checkMicrosoftAdmin: Could not parse error JSON from API.",
        );
      }
      return false;
    }
    const data = JSON.parse(responseBodyForLogging) as {
      value?: { displayName?: string; roleTemplateId?: string }[];
    };
    Logger.debug(
      "[Auth]",
      "checkMicrosoftAdmin: API response data (roles)",
      data.value,
    );

    const globalAdminRoleTemplateId = "62e90394-69f5-4237-9190-012177145e10"; // Global Administrator
    const isGlobalAdmin =
      data.value?.some(
        (role) => role.roleTemplateId === globalAdminRoleTemplateId,
      ) ?? false;
    Logger.debug(
      "[Auth]",
      `checkMicrosoftAdmin: Determined Global Admin: ${isGlobalAdmin}`,
    );
    return isGlobalAdmin;
  } catch (err) {
    Logger.error(
      "[Auth]",
      "checkMicrosoftAdmin: Exception while verifying Microsoft admin status",
      err,
    );
    return false;
  }
}

/**
 * Central NextAuth configuration for both Google and Microsoft providers.
 * Includes token refresh logic and admin verification callbacks.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: process.env.GOOGLE_ADMIN_SCOPES!,
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: true,
        },
      },
      allowDangerousEmailAccountLinking: true,
    }),
    MicrosoftEntraIDProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${
        process.env.MICROSOFT_TENANT_ID ?? "common"
      }/v2.0`,
      authorization: {
        params: {
          scope: `${process.env.MICROSOFT_GRAPH_SCOPES!} offline_access`,
          prompt: "consent",
          response_mode: "query",
        },
      },
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || !profile || !user?.email) {
        return "/login?error=SignInInformationMissing";
      }
      let isAdmin = false;
      if (account.provider === "google") {
        isAdmin = await checkGoogleAdmin(account.access_token!, user.email);
        if (!isAdmin) return "/login?error=GoogleAdminRequired";
      } else if (account.provider === "microsoft-entra-id") {
        isAdmin = await checkMicrosoftAdmin(account.access_token!);
        if (!isAdmin) return "/login?error=MicrosoftAdminRequired";
      }
      return isAdmin;
    },
    async jwt({ token, user, account, profile }) {
      const userKey = getUserKey();
      let finalToken: JWT = accountStore.get(userKey) ?? { ...token };

      if (user) {
        finalToken.sub = user.id ?? finalToken.sub;
        finalToken.name = user.name ?? finalToken.name;
        finalToken.email = user.email ?? finalToken.email;
        finalToken.picture = user.image ?? finalToken.picture;
      }

      if (account && profile) {
        finalToken.error = undefined;
        if (account.provider === "google") {
          Logger.debug("[Auth]", "Google Profile in JWT callback:", profile);
          finalToken.googleAccessToken = account.access_token;
          finalToken.googleRefreshToken = account.refresh_token;
          // account.expires_at is a Unix timestamp in seconds
          finalToken.googleExpiresAt = account.expires_at
            ? account.expires_at * 1000 // Convert to milliseconds
            : undefined;
          // Capture 'hd' (hosted domain) from Google profile if present
          finalToken.authFlowDomain =
            (profile as GoogleProfile).hd ?? finalToken.authFlowDomain;
          if ((profile as GoogleProfile).hd) {
            Logger.debug(
              "[Auth]",
              "Captured Google authFlowDomain (hd):",
              (profile as GoogleProfile).hd,
            );
          } else {
            Logger.warn(
              "[Auth]",
              "Google profile did not contain 'hd' claim for authFlowDomain.",
            );
          }
        } else if (account.provider === "microsoft-entra-id") {
          Logger.debug("[Auth]", "Microsoft Profile in JWT callback:", profile);
          finalToken.microsoftAccessToken = account.access_token;
          finalToken.microsoftRefreshToken = account.refresh_token;
          finalToken.microsoftExpiresAt = account.expires_at
            ? account.expires_at * 1000 // Convert to milliseconds
            : undefined;
          const accountTenantId =
            (profile as MicrosoftEntraIDProfile).tid ||
            (account as { tenantId?: string }).tenantId ||
            token.microsoftTenantId;
          finalToken.microsoftTenantId =
            accountTenantId || process.env.MICROSOFT_TENANT_ID;
          if (finalToken.microsoftTenantId) {
            Logger.debug(
              "[Auth]",
              "Captured Microsoft tenantId:",
              finalToken.microsoftTenantId,
            );
          } else {
            Logger.warn(
              "[Auth]",
              "Microsoft profile/account did not yield a tenantId.",
            );
          }
        }
      }
      accountStore.set(userKey, finalToken);

      const now = Date.now();
      let tokenNeedsUpdateInStore = false;
      const bufferTime = 5 * 60 * 1000;

      // Check Google token expiration
      if (finalToken.googleAccessToken && finalToken.googleExpiresAt) {
        const timeUntilExpiry = finalToken.googleExpiresAt - now;
        Logger.debug("[Auth]", "Google token expiry check:", {
          expiresAt: new Date(finalToken.googleExpiresAt).toISOString(),
          timeUntilExpiry: Math.round(timeUntilExpiry / 1000) + "s",
          needsRefresh: timeUntilExpiry < bufferTime,
        });

        if (timeUntilExpiry < bufferTime) {
          if (finalToken.googleRefreshToken) {
            Logger.info("[Auth]", "Refreshing Google token...");
            finalToken = await refreshGoogleToken(finalToken);
            tokenNeedsUpdateInStore = true;
          } else if (!finalToken.error) {
            Logger.error(
              "[Auth]",
              "Google token expired but no refresh token available",
            );
            finalToken.error = "RefreshTokenError";
            finalToken.googleAccessToken = undefined;
          }
        }
      }

      // Check Microsoft token expiration
      if (finalToken.microsoftAccessToken && finalToken.microsoftExpiresAt) {
        const timeUntilExpiry = finalToken.microsoftExpiresAt - now;
        Logger.debug("[Auth]", "Microsoft token expiry check:", {
          expiresAt: new Date(finalToken.microsoftExpiresAt).toISOString(),
          timeUntilExpiry: Math.round(timeUntilExpiry / 1000) + "s",
          needsRefresh: timeUntilExpiry < bufferTime,
        });

        if (timeUntilExpiry < bufferTime) {
          if (finalToken.microsoftRefreshToken) {
            Logger.info("[Auth]", "Refreshing Microsoft token...");
            finalToken = await refreshMicrosoftToken(finalToken);
            tokenNeedsUpdateInStore = true;
          } else if (!finalToken.error) {
            Logger.error(
              "[Auth]",
              "Microsoft token expired but no refresh token available",
            );
            finalToken.error = "RefreshTokenError";
            finalToken.microsoftAccessToken = undefined;
          }
        }
      }

      if (tokenNeedsUpdateInStore) accountStore.set(userKey, finalToken);
      return finalToken;
    },
    async session({ session, token }) {
      const validation = await validateTokenPresence(token);
      if (!validation.valid) {
        session.error = "MissingTokens" as unknown as "RefreshTokenError";
        session.hasGoogleAuth = false;
        session.hasMicrosoftAuth = false;
        return session;
      }
      session.user.id = token.sub ?? session.user.id;
      session.user.name = token.name ?? session.user.name;
      session.user.email = token.email ?? session.user.email;
      session.user.image = token.picture ?? session.user.image;
      session.hasGoogleAuth = !!token.googleAccessToken;
      session.hasMicrosoftAuth = !!token.microsoftAccessToken;
      session.googleToken = token.googleAccessToken;
      session.microsoftToken = token.microsoftAccessToken;
      session.microsoftTenantId = token.microsoftTenantId;
      session.authFlowDomain = token.authFlowDomain;
      if (token.error) session.error = token.error;
      return session;
    },
  },
});

export async function cleanupInvalidSession() {
  const userKey = getUserKey();
  accountStore.delete(userKey);
}
