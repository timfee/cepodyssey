/**
 * Error thrown when an API call fails.
 * @param message human readable error message
 * @param status HTTP status returned by the API
 * @param code optional error code provided by the API
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * Run an async operation with exponential backoff retries.
 * Client-side API errors are rethrown without retrying.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (
        error instanceof APIError &&
        (error.status < 500 || error.status === 429)
      ) {
        throw error; // Don't retry client errors (except 429)
      }
      if (i < retries - 1) {
        await new Promise((res) => setTimeout(res, 1000 * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}

/**
 * Perform a fetch request with a bearer token and JSON headers.
 */
export async function fetchWithAuth(
  url: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  return withRetry(() =>
    fetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }),
  );
}

/**
 * Parse a JSON API response and throw APIError on failure.
 */
export async function handleApiResponse<T>(
  res: Response,
): Promise<T | { alreadyExists: true }> {
  if (res.status === 409) {
    return { alreadyExists: true };
  }
  if (!res.ok) {
    const errorBody = (await res.json().catch(() => ({}))) as {
      error?: { message?: string; code?: string };
    };
    const message =
      errorBody.error?.message ?? `Connection failed. Please try again.`;
    throw new APIError(message, res.status, errorBody.error?.code);
  }
  if (res.status === 204) {
    return {} as T; // Success with no content
  }
  return (await res.json()) as T;
}
