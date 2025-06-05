# API Client Guidelines

This directory contains clients for communicating with external APIs (Google Workspace and Microsoft Graph).

## Core Concepts

1. **`ApiLogger`**: A simple class instantiated by a server action to track all API calls within that action's lifecycle. It is passed down through the call stack to `fetchWithAuth`. **It is not a singleton.**
2. **`APIError`**: A custom error class used to wrap all failed API responses. It includes the HTTP status and an error code from the API, allowing for specific error handling upstream.
3. **`fetchWithAuth`**: The primary function for making authenticated API calls. It handles adding the `Authorization` header, setting `Content-Type`, and invoking the `ApiLogger`.
4. **`withRetry`**: A simple exponential backoff wrapper for `fetchWithAuth` to handle transient network or server (5xx) errors.
5. **URL Builder**: All endpoint URLs are constructed via `lib/api/url-builder.ts` to ensure consistency and prevent hardcoded strings.

## Function Signature Pattern

All functions that make an API call must accept an optional `ApiLogger` instance and pass it to `fetchWithAuth`.

```typescript
import { ApiLogger } from "./api-logger";

export async function someApiFunction(
  token: string,
  params: SomeParams,
  logger?: ApiLogger, // Accept the logger
): Promise<SomeResult> {
  // ...
  const res = await fetchWithAuth(
    someUrl,
    token,
    { method: "POST", body: JSON.stringify(payload) },
    logger, // Pass it to the fetch client
  );
  // ...
}
```
