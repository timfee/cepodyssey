import { withRetry } from "@/lib/api/utils";
import { Logger } from "@/lib/utils/logger";
import type { JWT } from "next-auth/jwt";
import { config } from "@/lib/config";
import { MICROSOFT_GLOBAL_ADMIN_ROLE_TEMPLATE_ID } from "@/lib/constants/role-ids";


export async function validateTokenPresence(token: JWT): Promise<{
  valid: boolean;
  missingTokens: ("google" | "microsoft")[];
  error?: string;
}> {
  const missingTokens: ("google" | "microsoft")[] = [];
  if (!token.googleAccessToken || token.googleAccessToken === "undefined") {
    missingTokens.push("google");
  }
  if (!token.microsoftAccessToken || token.microsoftAccessToken === "undefined") {
    missingTokens.push("microsoft");
  }
  return {
    valid: missingTokens.length === 0,
    missingTokens,
    error: missingTokens.length > 0 ? "MISSING_TOKENS" : undefined,
  };
}

export async function checkGoogleAdmin(
  accessToken: string,
  email?: string | null,
): Promise<boolean> {
  if (!email || !accessToken) {
    Logger.warn("[Auth]", "checkGoogleAdmin: Email or accessToken missing.");
    return false;
  }
  const fetchUrl = `${config.GOOGLE_API_BASE}/admin/directory/v1/users/${encodeURIComponent(
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

export async function checkMicrosoftAdmin(accessToken: string): Promise<boolean> {
  if (!accessToken) {
    Logger.warn("[Auth]", "checkMicrosoftAdmin: AccessToken missing.");
    return false;
  }
  const fetchUrl = `${config.GRAPH_API_BASE}/me/memberOf/microsoft.graph.directoryRole?$select=displayName,roleTemplateId`;
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

    const isGlobalAdmin =
      data.value?.some(
        (role) => role.roleTemplateId === MICROSOFT_GLOBAL_ADMIN_ROLE_TEMPLATE_ID,
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
