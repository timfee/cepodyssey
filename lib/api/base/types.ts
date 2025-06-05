/**
 * Configuration required to create a provider-specific API client.
 */
export interface ApiClientConfig {
  provider: 'google' | 'microsoft';
  getToken: () => Promise<string>;
  handleProviderError: (error: unknown) => never;
}

/**
 * Options passed to the API client request method.
 */
export interface RequestConfig {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  responseType?: 'json' | 'text';
}
