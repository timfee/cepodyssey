import type { DefaultSession, Profile as NextAuthProfile, User } from "next-auth";
import type { JWT as NextAuthJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"];
    error?: "RefreshTokenError";
    hasGoogleAuth: boolean;
    hasMicrosoftAuth: boolean;
    googleToken?: string;
    microsoftToken?: string;
    microsoftTenantId?: string;
    authFlowDomain?: string; // Domain from Google's 'hd' (hosted domain) claim
  }
}

declare module "next-auth/jwt" {
  interface JWT extends NextAuthJWT {
    googleAccessToken?: string;
    googleRefreshToken?: string;
    googleExpiresAt?: number;
    microsoftAccessToken?: string;
    microsoftRefreshToken?: string;
    microsoftExpiresAt?: number;
    microsoftTenantId?: string;
    authFlowDomain?: string; // To store the Google 'hd' (hosted domain)
    error?: "RefreshTokenError";
  }
}
declare module "next-auth/providers/google" {
  interface GoogleProfile extends NextAuthProfile {
    hd?: string;
  }
}

declare module "next-auth/providers/microsoft-entra-id" {
  interface MicrosoftEntraIDProfile extends NextAuthProfile {
    tid?: string;
  }
}
