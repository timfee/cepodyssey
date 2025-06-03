import type { DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Extends the built-in session to include properties for authentication status
   * and server-side tokens.
   */
  interface Session {
    user: DefaultSession["user"];
    error?: "RefreshTokenError";
    hasGoogleAuth: boolean;
    hasMicrosoftAuth: boolean;
    // Server-side only properties
    googleToken?: string;
    microsoftToken?: string;
    microsoftTenantId?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extends the built-in JWT to store provider-specific tokens and metadata.
   */
  interface JWT {
    googleAccessToken?: string;
    googleRefreshToken?: string;
    googleExpiresAt?: number;
    microsoftAccessToken?: string;
    microsoftRefreshToken?: string;
    microsoftExpiresAt?: number;
    microsoftTenantId?: string;
    error?: "RefreshTokenError";
  }
}
