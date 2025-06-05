export interface ApiClientConfig {
  provider: 'google' | 'microsoft';
  getToken: () => Promise<string>;
  handleProviderError: (error: unknown) => never;
}

export interface RequestConfig {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}
