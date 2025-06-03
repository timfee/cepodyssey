import type { Account, Profile, Session, User } from "next-auth";
import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import MicrosoftEntraIDProvider from "next-auth/providers/microsoft-entra-id";
import process from "process";

// In-memory store to link accounts for the single conceptual admin user.
// This prevents different emails on Google vs Microsoft from creating
// separate sessions with NextAuth.
const ADMIN_USER_KEY = "admin-user";
const accountStore = new Map<string, JWT>();

function getUserKey(_userOrToken?: User | JWT): string {
  return ADMIN_USER_KEY;
}

async function refreshGoogleToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
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
    if (!response.ok) throw refreshed;
    return {
      ...token,
      googleAccessToken: refreshed.access_token,
      googleExpiresAt: Date.now() + refreshed.expires_in * 1000,
      googleRefreshToken: refreshed.refresh_token ?? token.googleRefreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error("Error refreshing Google token:", error);
    return {
      ...token,
      googleAccessToken: undefined,
      googleRefreshToken: undefined,
      googleExpiresAt: undefined,
      error: "RefreshTokenError",
    };
  }
}

async function refreshMicrosoftToken(token: JWT): Promise<JWT> {
  try {
    // Prioritize tenant ID from the token (captured during initial specific login)
    // then from .env (if this instance of app is for a specific tenant)
    // then 'common' as a last resort.
    const tenantForRefresh =
      token.microsoftTenantId || process.env.MICROSOFT_TENANT_ID || "common";
    if (
      tenantForRefresh === "common" &&
      !process.env.MICROSOFT_TENANT_ID &&
      !token.microsoftTenantId
    ) {
      console.warn(
        "Attempting Microsoft token refresh with 'common' endpoint without a specific tenant ID in token or .env. This might fail for organizational accounts if a specific tenant context is required after initial login."
      );
    }

    const response = await fetch(
      `https://login.microsoftonline.com/${tenantForRefresh}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          grant_type: "refresh_token",
          refresh_token: token.microsoftRefreshToken as string,
          scope: process.env.MICROSOFT_GRAPH_SCOPES!,
        }),
      }
    );
    const refreshed = await response.json();
    if (!response.ok) throw refreshed;
    return {
      ...token,
      microsoftAccessToken: refreshed.access_token,
      microsoftExpiresAt: Date.now() + refreshed.expires_in * 1000,
      microsoftRefreshToken:
        refreshed.refresh_token ?? token.microsoftRefreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error("Error refreshing Microsoft token:", error);
    return {
      ...token,
      microsoftAccessToken: undefined,
      microsoftRefreshToken: undefined,
      microsoftExpiresAt: undefined,
      error: "RefreshTokenError",
    };
  }
}

async function checkGoogleAdmin(
  accessToken: string,
  email?: string | null
): Promise<boolean> {
  if (!email || !accessToken) return false;
  try {
    const res = await fetch(
      `${
        process.env.GOOGLE_API_BASE
      }/admin/directory/v1/users/${encodeURIComponent(
        email
      )}?projection=basic&viewType=domain_public`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.warn(
        "Google admin check failed API call:",
        res.status,
        errorData
      );
      return false;
    }
    const data = (await res.json()) as {
      isAdmin?: boolean;
      suspensionReason?: string;
    };
    return data.isAdmin === true && !data.suspensionReason;
  } catch (err) {
    console.error("Failed to verify Google admin status during signIn:", err);
    return false;
  }
}

async function checkMicrosoftAdmin(accessToken: string): Promise<boolean> {
  if (!accessToken) return false;
  try {
    const res = await fetch(
      `${process.env.GRAPH_API_BASE}/me/memberOf/microsoft.graph.directoryRole?$select=displayName,roleTemplateId`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.warn(
        "Microsoft admin check failed API call:",
        res.status,
        errorData
      );
      return false;
    }
    const data = (await res.json()) as {
      value?: { displayName?: string; roleTemplateId?: string }[];
    };
    const globalAdminRoleTemplateId = "62e90394-69f5-4237-9190-012177145e10";
    return (
      data.value?.some(
        (role) => role.roleTemplateId === globalAdminRoleTemplateId
      ) ?? false
    );
  } catch (err) {
    console.error(
      "Failed to verify Microsoft admin status during signIn:",
      err
    );
    return false;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: process.env.GOOGLE_ADMIN_SCOPES,
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    MicrosoftEntraIDProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      issuer: `https://login.microsoftonline.com/${
        process.env.MICROSOFT_TENANT_ID ?? "common"
      }/v2.0`,
      authorization: {
        params: {
          scope: process.env.MICROSOFT_GRAPH_SCOPES,
        },
      },
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

      if (account) {
        finalToken.error = undefined; // Clear previous errors on new account activity
        if (account.provider === "google") {
          finalToken.googleAccessToken = account.access_token;
          finalToken.googleRefreshToken = account.refresh_token;
          finalToken.googleExpiresAt = account.expires_at
            ? Date.now() + account.expires_at * 1000
            : undefined;
        } else if (account.provider === "microsoft-entra-id") {
          finalToken.microsoftAccessToken = account.access_token;
          finalToken.microsoftRefreshToken = account.refresh_token;
          finalToken.microsoftExpiresAt = account.expires_at
            ? Date.now() + account.expires_at * 1000
            : undefined;
          // Capture tenant ID from account details (profile.tid or account.tenantId)
          // This is crucial if login wasn't against a pre-configured tenant in .env
          const accountTenantId =
            (profile as { tid?: string })?.tid ||
            (account as any).tenantId ||
            token.microsoftTenantId;
          finalToken.microsoftTenantId =
            accountTenantId || process.env.MICROSOFT_TENANT_ID; // Fallback to env
        }
      }
      accountStore.set(userKey, finalToken);

      const now = Date.now();
      let tokenNeedsUpdateInStore = false;
      if (
        finalToken.googleAccessToken &&
        (finalToken.googleExpiresAt ?? 0) < now
      ) {
        if (finalToken.googleRefreshToken) {
          finalToken = await refreshGoogleToken(finalToken);
          tokenNeedsUpdateInStore = true;
        } else if (!finalToken.error) {
          finalToken.error = "RefreshTokenError";
          finalToken.googleAccessToken = undefined;
        }
      }
      if (
        finalToken.microsoftAccessToken &&
        (finalToken.microsoftExpiresAt ?? 0) < now
      ) {
        if (finalToken.microsoftRefreshToken) {
          finalToken = await refreshMicrosoftToken(finalToken);
          tokenNeedsUpdateInStore = true;
        } else if (!finalToken.error) {
          finalToken.error = "RefreshTokenError";
          finalToken.microsoftAccessToken = undefined;
        }
      }
      if (tokenNeedsUpdateInStore) {
        accountStore.set(userKey, finalToken);
      }
      return finalToken;
    },
    async session({ session, token }) {
      session.user.id = token.sub ?? session.user.id;
      session.user.name = token.name ?? session.user.name;
      session.user.email = token.email ?? session.user.email;
      session.user.image = token.picture ?? session.user.image;
      session.hasGoogleAuth = !!token.googleAccessToken;
      session.hasMicrosoftAuth = !!token.microsoftAccessToken;
      session.googleToken = token.googleAccessToken;
      session.microsoftToken = token.microsoftAccessToken;
      session.microsoftTenantId = token.microsoftTenantId;
      if (token.error) {
        session.error = token.error;
      }
      return session;
    },
  },
});
