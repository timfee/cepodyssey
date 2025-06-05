export function mockEnv() {
  process.env = {
    ...process.env,
    NODE_ENV: 'test',
    AUTH_SECRET: 'test-secret-at-least-32-characters-long',
    GOOGLE_CLIENT_ID: 'test-google-client',
    GOOGLE_CLIENT_SECRET: 'test-google-secret',
    MICROSOFT_CLIENT_ID: 'test-ms-client',
    MICROSOFT_CLIENT_SECRET: 'test-ms-secret',
    MICROSOFT_TENANT_ID: 'test-tenant-id',
    GOOGLE_API_BASE: 'https://admin.googleapis.com',
    GRAPH_API_BASE: 'https://graph.microsoft.com/v1.0',
    GOOGLE_ADMIN_SCOPES: 'test-scopes',
    MICROSOFT_GRAPH_SCOPES: 'test-scopes',
    NEXT_PUBLIC_ENABLE_API_DEBUG: 'false',
  }
}
