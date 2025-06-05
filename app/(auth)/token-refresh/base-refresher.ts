import { Logger } from "@/lib/utils/logger";
import type { JWT } from "next-auth/jwt";

interface RefreshConfig {
  provider: string;
  url: string;
  params: Record<string, string>;
  onSuccess: (token: JWT, refreshed: unknown) => JWT;
  clear: Partial<JWT>;
}

export async function refreshTokenBase(
  token: JWT,
  config: RefreshConfig,
): Promise<JWT> {
  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(config.params),
    });
    const refreshed = await response.json();
    if (!response.ok) {
      Logger.error(
        "[Auth]",
        `${config.provider} token refresh API error`,
        refreshed,
      );
      throw refreshed;
    }
    return config.onSuccess(token, refreshed);
  } catch (error) {
    Logger.error(
      "[Auth]",
      `Exception during ${config.provider} token refresh`,
      error,
    );
    return {
      ...token,
      ...config.clear,
      error: "RefreshTokenError",
    };
  }
}
