// ./app/(auth)/auth.ts
import type { User } from "next-auth";
import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import MicrosoftEntraIDProvider from "next-auth/providers/microsoft-entra-id";

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
    if (!response.ok) {
      console.error("Google token refresh API error:", refreshed);
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
    console.error("Exception during Google token refresh:", error);
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
    const tenantForRefresh =
      token.microsoftTenantId || process.env.MICROSOFT_TENANT_ID || "common";
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
    if (!response.ok) {
      console.error("Microsoft token refresh API error:", refreshed);
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
    console.error("Exception during Microsoft token refresh:", error);
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
  if (!email || !accessToken) {
    console.warn("checkGoogleAdmin: Email or accessToken missing.");
    return false;
  }
  const fetchUrl = `${
    process.env.GOOGLE_API_BASE
  }/admin/directory/v1/users/${encodeURIComponent(
    email
  )}?fields=isAdmin,suspended,primaryEmail`;

  console.log(
    `checkGoogleAdmin: Fetching admin status for ${email} from ${fetchUrl}`
  );
  try {
    const res = await fetch(fetchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const responseBodyForLogging = await res.clone().text(); // Clone to log body without consuming it
    console.log(
      `checkGoogleAdmin: API response status: ${res.status}, body: ${responseBodyForLogging}`
    );

    if (!res.ok) {
      console.warn(
        `checkGoogleAdmin: API call failed with status ${res.status}. User: ${email}`
      );
      try {
        const errorData = await res.json();
        console.warn("checkGoogleAdmin: API error data:", errorData);
      } catch {
        console.warn("checkGoogleAdmin: Could not parse error JSON from API.");
      }
      return false;
    }
    const data = (await res.json()) as {
      isAdmin?: boolean;
      suspensionReason?: string;
      primaryEmail?: string;
    };
    console.log(`checkGoogleAdmin: API response data for ${email}:`, data);

    if (data.primaryEmail?.toLowerCase() !== email.toLowerCase()) {
      console.warn(
        `checkGoogleAdmin: Requested email ${email} does not match primaryEmail ${data.primaryEmail} from response. This might indicate a non-Workspace account or an alias issue.`
      );
    }

    const isSuperAdmin = data.isAdmin === true && !data.suspensionReason;
    console.log(
      `checkGoogleAdmin: User ${email}, isAdmin: ${data.isAdmin}, suspensionReason: ${data.suspensionReason}, Determined SuperAdmin: ${isSuperAdmin}`
    );
    return isSuperAdmin;
  } catch (err) {
    console.error(
      `checkGoogleAdmin: Exception while verifying Google admin status for ${email}:`,
      err
    );
    return false;
  }
}

async function checkMicrosoftAdmin(accessToken: string): Promise<boolean> {
  if (!accessToken) {
    console.warn("checkMicrosoftAdmin: AccessToken missing.");
    return false;
  }
  const fetchUrl = `${process.env.GRAPH_API_BASE}/me/memberOf/microsoft.graph.directoryRole?$select=displayName,roleTemplateId`;
  console.log(`checkMicrosoftAdmin: Fetching admin roles from ${fetchUrl}`);
  try {
    const res = await fetch(fetchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const responseBodyForLogging = await res.clone().text();
    console.log(
      `checkMicrosoftAdmin: API response status: ${res.status}, body: ${responseBodyForLogging}`
    );

    if (!res.ok) {
      console.warn(
        `checkMicrosoftAdmin: API call failed with status ${res.status}.`
      );
      try {
        const errorData = await res.json();
        console.warn("checkMicrosoftAdmin: API error data:", errorData);
      } catch {
        console.warn(
          "checkMicrosoftAdmin: Could not parse error JSON from API."
        );
      }
      return false;
    }
    const data = (await res.json()) as {
      value?: { displayName?: string; roleTemplateId?: string }[];
    };
    console.log("checkMicrosoftAdmin: API response data (roles):", data.value);

    const globalAdminRoleTemplateId = "62e90394-69f5-4237-9190-012177145e10";
    const isGlobalAdmin =
      data.value?.some(
        (role) => role.roleTemplateId === globalAdminRoleTemplateId
      ) ?? false;
    console.log(
      `checkMicrosoftAdmin: Determined Global Admin: ${isGlobalAdmin}`
    );
    return isGlobalAdmin;
  } catch (err) {
    console.error(
      "checkMicrosoftAdmin: Exception while verifying Microsoft admin status:",
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
      console.log(
        "signIn callback initiated. Provider:",
        account?.provider,
        "User email:",
        user?.email
      );
      if (!account || !profile || !user?.email) {
        console.warn(
          "signIn callback: Missing account, profile, or user email for",
          user
        );
        return "/login?error=SignInInformationMissing";
      }
      let isAdmin = false;
      if (account.provider === "google") {
        isAdmin = await checkGoogleAdmin(account.access_token!, user.email);
        if (!isAdmin) {
          console.warn(`User ${user.email} did not pass Google Admin check.`);
          return "/login?error=GoogleAdminRequired";
        }
      } else if (account.provider === "microsoft-entra-id") {
        isAdmin = await checkMicrosoftAdmin(account.access_token!);
        if (!isAdmin) {
          console.warn(
            `User ${user.email} did not pass Microsoft Admin check.`
          );
          return "/login?error=MicrosoftAdminRequired";
        }
      }
      console.log(
        `signIn callback: User ${user.email} from provider ${account.provider} isAdmin: ${isAdmin}`
      );
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
        finalToken.error = undefined;
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
          const accountTenantId =
            (profile as { tid?: string })?.tid ||
            (account as { tenantId?: string }).tenantId ||
            token.microsoftTenantId;
          finalToken.microsoftTenantId =
            accountTenantId || process.env.MICROSOFT_TENANT_ID;
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
          console.log("Refreshing Google token for admin-user...");
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
          console.log("Refreshing Microsoft token for admin-user...");
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
