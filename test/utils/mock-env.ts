export function mockEnv() {
  process.env = {
    ...process.env,
    NODE_ENV: 'test',
    AUTH_SECRET: 'test-secret-at-least-32-characters-long',
    GOOGLE_CLIENT_ID: 'test-google-client',
    GOOGLE_CLIENT_SECRET: 'test-google-secret',
    MICROSOFT_CLIENT_ID: 'test-ms-client',
    MICROSOFT_CLIENT_SECRET: 'test-ms-secret',
    MICROSOFT_TENANT_ID: '123e4567-e89b-12d3-a456-426614174000',
    GOOGLE_API_BASE: 'https://admin.googleapis.com',
    GRAPH_API_BASE: 'https://graph.microsoft.com/v1.0',
    GOOGLE_ADMIN_SCOPES: 'test-scopes',
    MICROSOFT_GRAPH_SCOPES: 'test-scopes',
    // eslint-disable-next-line custom/no-hardcoded-admin-id
    MICROSOFT_GLOBAL_ADMIN_ROLE_TEMPLATE_ID:
      process.env.MICROSOFT_GLOBAL_ADMIN_ROLE_TEMPLATE_ID ||
      '62e90394-69f5-4237-9190-012177145e10',
    NEXT_PUBLIC_ENABLE_API_DEBUG: 'false',
  }
}
