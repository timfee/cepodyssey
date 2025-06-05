/* eslint-disable custom/no-hardcoded-url */
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

/** Environment variables validated with t3-env */
export const env = createEnv({
  server: {
    AUTH_SECRET: z.string().min(32),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GOOGLE_ADMIN_SCOPES: z.string(),
    MICROSOFT_CLIENT_ID: z.string(),
    MICROSOFT_CLIENT_SECRET: z.string(),
    MICROSOFT_TENANT_ID: z.string().uuid().optional(),
    MICROSOFT_GRAPH_SCOPES: z.string(),
    GOOGLE_API_BASE: z.string().url().default('https://admin.googleapis.com'),
    GOOGLE_IDENTITY_BASE: z
      .string()
      .url()
      .default('https://cloudidentity.googleapis.com'),
    GRAPH_API_BASE: z.string().url().default('https://graph.microsoft.com/v1.0'),
    GOOGLE_OAUTH_BASE: z
      .string()
      .url()
      .default('https://oauth2.googleapis.com'),
    MICROSOFT_LOGIN_BASE: z
      .string()
      .url()
      .default('https://login.microsoftonline.com'),
    GOOGLE_ADMIN_CONSOLE_BASE: z
      .string()
      .url()
      .default('https://admin.google.com'),
    AZURE_PORTAL_BASE: z.string().url().default('https://portal.azure.com'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  },
  client: {
    NEXT_PUBLIC_ENABLE_API_DEBUG: z.enum(['true', 'false']).optional(),
    NEXT_PUBLIC_LOG_TO_CONSOLE: z.enum(['true', 'false']).optional(),
    NEXT_PUBLIC_LOG_LEVEL: z.string().optional(),
    NEXT_PUBLIC_LOG_LEVEL_TO_SHOW_IN_TOASTS: z.string().optional(),
    NEXT_PUBLIC_MICROSOFT_TENANT_ID: z.string().uuid().optional(),
  },
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_ADMIN_SCOPES: process.env.GOOGLE_ADMIN_SCOPES,
    MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
    MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
    MICROSOFT_TENANT_ID: process.env.MICROSOFT_TENANT_ID,
    MICROSOFT_GRAPH_SCOPES: process.env.MICROSOFT_GRAPH_SCOPES,
    GOOGLE_API_BASE: process.env.GOOGLE_API_BASE,
    GOOGLE_IDENTITY_BASE: process.env.GOOGLE_IDENTITY_BASE,
    GRAPH_API_BASE: process.env.GRAPH_API_BASE,
    GOOGLE_OAUTH_BASE: process.env.GOOGLE_OAUTH_BASE,
    MICROSOFT_LOGIN_BASE: process.env.MICROSOFT_LOGIN_BASE,
    GOOGLE_ADMIN_CONSOLE_BASE: process.env.GOOGLE_ADMIN_CONSOLE_BASE,
    AZURE_PORTAL_BASE: process.env.AZURE_PORTAL_BASE,
    NEXT_PUBLIC_ENABLE_API_DEBUG: process.env.NEXT_PUBLIC_ENABLE_API_DEBUG,
    NEXT_PUBLIC_LOG_TO_CONSOLE: process.env.NEXT_PUBLIC_LOG_TO_CONSOLE,
    NEXT_PUBLIC_LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL,
    NEXT_PUBLIC_LOG_LEVEL_TO_SHOW_IN_TOASTS:
      process.env.NEXT_PUBLIC_LOG_LEVEL_TO_SHOW_IN_TOASTS,
    NEXT_PUBLIC_MICROSOFT_TENANT_ID: process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID,
    NODE_ENV: process.env.NODE_ENV,
  },
})
