// ./app/(auth)/auth.ts
import { withRetry } from "@/lib/api/utils";
import type { User } from "next-auth"; // Standard NextAuth types
import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt"; // NextAuth JWT type
import GoogleProvider, { type GoogleProfile } from "next-auth/providers/google";
import MicrosoftEntraIDProvider, {
  type MicrosoftEntraIDProfile,
} from "next-auth/providers/microsoft-entra-id";
// Assuming refresh token functions are correctly in ./refresh as per your project-code.md

// Assuming withRetry is from your lib/utils/retry.ts or lib/api/utils.ts if moved

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
  )}?fields=isAdmin,suspended,primaryEmail`; // Request primaryEmail for logging

  console.log(
    `checkGoogleAdmin: Fetching admin status for ${email} from ${fetchUrl}`
  );
  try {
    const res = await withRetry(() =>
      // Using withRetry from your project-code.md's auth.ts
      fetch(fetchUrl, { headers: { Authorization: `Bearer ${accessToken}` } })
    );

    const responseBodyForLogging = await res.clone().text();
    console.log(
      `checkGoogleAdmin: API response status: ${res.status}, body: ${responseBodyForLogging}`
    );

    if (!res.ok) {
      console.warn(
        `checkGoogleAdmin: API call failed with status ${res.status}. User: ${email}`
      );
      try {
        const errorData = JSON.parse(responseBodyForLogging);
        console.warn("checkGoogleAdmin: API error data:", errorData);
      } catch {
        console.warn("checkGoogleAdmin: Could not parse error JSON from API.");
      }
      return false;
    }
    const data = JSON.parse(responseBodyForLogging) as {
      isAdmin?: boolean;
      suspended?: boolean; // Corrected from suspensionReason
      primaryEmail?: string;
    };
    console.log(
      `checkGoogleAdmin: Parsed API response data for ${email}:`,
      data
    );

    const isSuperAdmin = data.isAdmin === true && data.suspended === false;
    console.log(
      `checkGoogleAdmin: User ${email}, isAdmin: ${data.isAdmin}, suspended: ${data.suspended}, Determined SuperAdmin: ${isSuperAdmin}`
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
    const res = await withRetry(() =>
      // Using withRetry
      fetch(fetchUrl, { headers: { Authorization: `Bearer ${accessToken}` } })
    );

    const responseBodyForLogging = await res.clone().text();
    console.log(
      `checkMicrosoftAdmin: API response status: ${res.status}, body: ${responseBodyForLogging}`
    );

    if (!res.ok) {
      console.warn(
        `checkMicrosoftAdmin: API call failed with status ${res.status}.`
      );
      try {
        const errorData = JSON.parse(responseBodyForLogging);
        console.warn("checkMicrosoftAdmin: API error data:", errorData);
      } catch {
        console.warn(
          "checkMicrosoftAdmin: Could not parse error JSON from API."
        );
      }
      return false;
    }
    const data = JSON.parse(responseBodyForLogging) as {
      value?: { displayName?: string; roleTemplateId?: string }[];
    };
    console.log("checkMicrosoftAdmin: API response data (roles):", data.value);

    const globalAdminRoleTemplateId = "62e90394-69f5-4237-9190-012177145e10"; // Global Administrator
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
  secret: process.env.AUTH_SECRET, // Your project-code.md used NEXTAUTH_SECRET, ensure consistency or use AUTH_SECRET
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: process.env.GOOGLE_ADMIN_SCOPES!,
          access_type: "offline",
          prompt: "consent",
        },
      },
      allowDangerousEmailAccountLinking: true, // As per your project-code.md
    }),
    MicrosoftEntraIDProvider({
      // Using direct provider
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${
        process.env.MICROSOFT_TENANT_ID ?? "common"
      }/v2.0`,
      authorization: {
        params: {
          scope: process.env.MICROSOFT_GRAPH_SCOPES!,
          prompt: "consent", // Added for consistency, can be reviewed
        },
      },
      allowDangerousEmailAccountLinking: true, // As per your project-code.md
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect to login page on auth errors
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
        finalToken.error = undefined; // Clear previous errors
        if (account.provider === "google") {
          console.log(
            "Google Profile in JWT callback:",
            JSON.stringify(profile, null, 2)
          ); // Log Google profile
          finalToken.googleAccessToken = account.access_token;
          finalToken.googleRefreshToken = account.refresh_token;
          finalToken.googleExpiresAt = account.expires_at
            ? Date.now() + account.expires_at * 1000
            : undefined;
          // Attempt to capture 'hd' (hosted domain) from Google profile
          finalToken.authFlowDomain =
            (profile as GoogleProfile).hd ?? finalToken.authFlowDomain;
          if ((profile as GoogleProfile).hd) {
            console.log(
              "Captured Google authFlowDomain (hd):",
              (profile as GoogleProfile).hd
            );
          } else {
            console.warn(
              "Google profile did not contain 'hd' claim for authFlowDomain."
            );
          }
        } else if (account.provider === "microsoft-entra-id") {
          console.log(
            "Microsoft Profile in JWT callback:",
            JSON.stringify(profile, null, 2)
          ); // Log Microsoft profile
          finalToken.microsoftAccessToken = account.access_token;
          finalToken.microsoftRefreshToken = account.refresh_token;
          finalToken.microsoftExpiresAt = account.expires_at
            ? Date.now() + account.expires_at * 1000
            : undefined;
          const accountTenantId =
            (profile as MicrosoftEntraIDProfile).tid ||
            (account as { tenantId?: string }).tenantId ||
            token.microsoftTenantId;
          finalToken.microsoftTenantId =
            accountTenantId || process.env.MICROSOFT_TENANT_ID;
          if (finalToken.microsoftTenantId) {
            console.log(
              "Captured Microsoft tenantId:",
              finalToken.microsoftTenantId
            );
          } else {
            console.warn("Microsoft profile/account did not yield a tenantId.");
          }
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
          finalToken = await refreshGoogleToken(finalToken); // refreshGoogleToken from ./refresh
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
          finalToken = await refreshMicrosoftToken(finalToken); // refreshMicrosoftToken from ./refresh
          tokenNeedsUpdateInStore = true;
        } else if (!finalToken.error) {
          finalToken.error = "RefreshTokenError";
          finalToken.microsoftAccessToken = undefined;
        }
      }
      if (tokenNeedsUpdateInStore) accountStore.set(userKey, finalToken);
      return finalToken;
    },
    async session({ session, token }) {
      session.user.id = token.sub ?? session.user.id;
      session.user.name = token.name ?? session.user.name;
      session.user.email = token.email ?? session.user.email;
      session.user.image = token.picture ?? session.user.image;
      session.hasGoogleAuth = !!token.googleAccessToken;
      session.hasMicrosoftAuth = !!token.microsoftAccessToken;
      session.googleToken = token.googleAccessToken; // For server-side use
      session.microsoftToken = token.microsoftAccessToken; // For server-side use
      session.microsoftTenantId = token.microsoftTenantId;
      session.authFlowDomain = token.authFlowDomain; // Pass Google domain to session
      if (token.error) session.error = token.error;
      return session;
    },
  },
});
