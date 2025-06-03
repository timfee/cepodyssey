export class APIError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = "APIError";
  }
}

async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 3
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

export async function fetchWithAuth(
  url: string,
  token: string,
  init?: RequestInit
): Promise<Response> {
  return withRetry(() =>
    fetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
  );
}

export async function handleApiResponse<T>(
  res: Response
): Promise<T | { alreadyExists: true }> {
  if (res.status === 409) {
    return { alreadyExists: true };
  }
  if (!res.ok) {
    const errorBody = (await res.json().catch(() => ({}))) as {
      error?: { message?: string; code?: string };
    };
    const message =
      errorBody.error?.message ?? `Request failed with status ${res.status}`;
    throw new APIError(message, res.status, errorBody.error?.code);
  }
  if (res.status === 204) {
    return {} as T; // Success with no content
  }
  return (await res.json()) as T;
}
