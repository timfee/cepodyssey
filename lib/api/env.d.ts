declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // API URLs
      GOOGLE_API_BASE: string;
      GOOGLE_IDENTITY_BASE: string;
      GRAPH_API_BASE: string;
      GOOGLE_OAUTH_BASE?: string;
      MICROSOFT_LOGIN_BASE?: string;

      // Portal URLs
      GOOGLE_ADMIN_CONSOLE_BASE?: string;
      AZURE_PORTAL_BASE?: string;

      // Auth configuration
      AUTH_SECRET: string;
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      GOOGLE_ADMIN_SCOPES: string;
      MICROSOFT_CLIENT_ID: string;
      MICROSOFT_CLIENT_SECRET: string;
      MICROSOFT_TENANT_ID?: string;
      MICROSOFT_GRAPH_SCOPES: string;
      NEXT_PUBLIC_MICROSOFT_TENANT_ID?: string;
    }
  }
}

export {};
