// ./next-auth.d.ts
import type {
  DefaultSession,
  Profile as NextAuthProfile,
  User,
} from "next-auth"; // Added Profile
import type { JWT as NextAuthJWT } from "next-auth/jwt"; // Renamed to NextAuthJWT to avoid conflict

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
    // Extends imported JWT
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

// Extend the Profile type for specific providers if needed
declare module "next-auth/providers/google" {
  interface GoogleProfile extends NextAuthProfile {
    // Use NextAuthProfile as base
    hd?: string;
  }
}

declare module "next-auth/providers/microsoft-entra-id" {
  interface MicrosoftEntraIDProfile extends NextAuthProfile {
    // Use NextAuthProfile as base
    tid?: string;
  }
}
