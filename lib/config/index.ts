import { z } from "zod";

const envSchema = z.object({
  // Auth
  AUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_ADMIN_SCOPES: z.string(),
  MICROSOFT_CLIENT_ID: z.string(),
  MICROSOFT_CLIENT_SECRET: z.string(),
  MICROSOFT_TENANT_ID: z.string().uuid().optional(),
  MICROSOFT_GRAPH_SCOPES: z.string(),
  NEXT_PUBLIC_MICROSOFT_TENANT_ID: z.string().uuid().optional(),

  // API URLs (with defaults)
  GOOGLE_API_BASE: z.string().url().default("https://admin.googleapis.com"),
  GOOGLE_IDENTITY_BASE: z
    .string()
    .url()
    .default("https://cloudidentity.googleapis.com"),
  GRAPH_API_BASE: z.string().url().default("https://graph.microsoft.com/v1.0"),
  GOOGLE_OAUTH_BASE: z
    .string()
    .url()
    .default("https://oauth2.googleapis.com"),
  MICROSOFT_LOGIN_BASE: z
    .string()
    .url()
    .default("https://login.microsoftonline.com"),

  // Portal URLs
  GOOGLE_ADMIN_CONSOLE_BASE: z
    .string()
    .url()
    .default("https://admin.google.com"),
  AZURE_PORTAL_BASE: z.string().url().default("https://portal.azure.com"),

  // Feature flags
  NEXT_PUBLIC_ENABLE_API_DEBUG: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_LOG_TO_CONSOLE: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_LOG_LEVEL: z.string().optional(),
  NEXT_PUBLIC_LOG_LEVEL_TO_SHOW_IN_TOASTS: z.string().optional(),
});

export const config = envSchema.parse(process.env);
