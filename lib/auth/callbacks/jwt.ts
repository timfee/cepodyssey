import type { Account, Profile, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { GoogleProfile } from "next-auth/providers/google";
import type { MicrosoftEntraIDProfile } from "next-auth/providers/microsoft-entra-id";
import { getStoredToken, setStoredToken } from "../utils/session-store";

import { Logger } from "@/lib/utils/logger";
import { Provider } from "@/lib/constants/enums";
import { refreshGoogleToken, refreshMicrosoftToken } from "../token-refresh";
import { config } from "@/lib/config";

async function handleGoogleAccount(
  finalToken: JWT,
  account: Account,
  profile: GoogleProfile,
): Promise<JWT> {
  Logger.debug("[Auth]", "Google Profile in JWT callback:", profile);
  finalToken.googleAccessToken = account.access_token;
  finalToken.googleRefreshToken = account.refresh_token;
  finalToken.googleExpiresAt = account.expires_at
    ? account.expires_at * 1000
    : undefined;
  finalToken.authFlowDomain = profile.hd ?? finalToken.authFlowDomain;
  if (profile.hd) {
    Logger.debug("[Auth]", "Captured Google authFlowDomain (hd):", profile.hd);
  } else {
    Logger.warn(
      "[Auth]",
      "Google profile did not contain 'hd' claim for authFlowDomain.",
    );
  }
  return finalToken;
}

async function handleMicrosoftAccount(
  finalToken: JWT,
  account: Account,
  profile: MicrosoftEntraIDProfile,
  token: JWT,
): Promise<JWT> {
  Logger.debug("[Auth]", "Microsoft Profile in JWT callback:", profile);
  finalToken.microsoftAccessToken = account.access_token;
  finalToken.microsoftRefreshToken = account.refresh_token;
  finalToken.microsoftExpiresAt = account.expires_at
    ? account.expires_at * 1000
    : undefined;
  const accountTenantId =
    profile.tid ||
    (account as { tenantId?: string }).tenantId ||
    token.microsoftTenantId;
  finalToken.microsoftTenantId = accountTenantId || config.MICROSOFT_TENANT_ID;
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
  return finalToken;
}

function needsRefresh(
  expiresAt: number,
  now: number,
  bufferTime: number,
): boolean {
  return expiresAt - now < bufferTime;
}

async function refreshTokens(
  finalToken: JWT,
  now: number,
  bufferTime: number,
): Promise<{ token: JWT; updated: boolean }> {
  let updated = false;
  if (finalToken.googleAccessToken && finalToken.googleExpiresAt) {
    const timeUntilExpiry = finalToken.googleExpiresAt - now;
    Logger.debug("[Auth]", "Google token expiry check:", {
      expiresAt: new Date(finalToken.googleExpiresAt).toISOString(),
      timeUntilExpiry: Math.round(timeUntilExpiry / 1000) + "s",
      needsRefresh: needsRefresh(finalToken.googleExpiresAt, now, bufferTime),
    });
    if (needsRefresh(finalToken.googleExpiresAt, now, bufferTime)) {
      if (finalToken.googleRefreshToken) {
        Logger.info("[Auth]", "Refreshing Google token...");
        finalToken = await refreshGoogleToken(finalToken);
        updated = true;
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

  if (finalToken.microsoftAccessToken && finalToken.microsoftExpiresAt) {
    const timeUntilExpiry = finalToken.microsoftExpiresAt - now;
    Logger.debug("[Auth]", "Microsoft token expiry check:", {
      expiresAt: new Date(finalToken.microsoftExpiresAt).toISOString(),
      timeUntilExpiry: Math.round(timeUntilExpiry / 1000) + "s",
      needsRefresh: needsRefresh(
        finalToken.microsoftExpiresAt,
        now,
        bufferTime,
      ),
    });
    if (needsRefresh(finalToken.microsoftExpiresAt, now, bufferTime)) {
      if (finalToken.microsoftRefreshToken) {
        Logger.info("[Auth]", "Refreshing Microsoft token...");
        finalToken = await refreshMicrosoftToken(finalToken);
        updated = true;
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
  return { token: finalToken, updated };
}
export default async function jwtCallback({
  token,
  user,
  account,
  profile,
}: {
  token: JWT;
  user?: User | null;
  account?: Account | null;
  profile?: Profile | null;
}): Promise<JWT> {
  let finalToken: JWT = getStoredToken() ?? { ...token };

  if (user) {
    finalToken.sub = user.id ?? finalToken.sub;
    finalToken.name = user.name ?? finalToken.name;
    finalToken.email = user.email ?? finalToken.email;
    finalToken.picture = user.image ?? finalToken.picture;
  }

  if (account && profile) {
    finalToken.error = undefined;
    if (account.provider === Provider.GOOGLE) {
      finalToken = await handleGoogleAccount(
        finalToken,
        account,
        profile as GoogleProfile,
      );
    } else if (account.provider === "microsoft-entra-id") {
      finalToken = await handleMicrosoftAccount(
        finalToken,
        account,
        profile as MicrosoftEntraIDProfile,
        token,
      );
    }
  }

  setStoredToken(finalToken);

  const now = Date.now();
  const bufferTime = 5 * 60 * 1000;
  const { token: updatedToken, updated } = await refreshTokens(
    finalToken,
    now,
    bufferTime,
  );
  if (updated) setStoredToken(updatedToken);
  return updatedToken;
}
