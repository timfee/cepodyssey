"use client";
import type { ReactElement } from "react";

/**
 * Handles unhandled errors across the app.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactElement | null {
  const isAuthError =
    error.message?.includes("Authentication") ||
    error.message?.includes("session expired");

  if (isAuthError && typeof window !== "undefined") {
    window.location.href = "/login?error=session_expired";
    return null;
  }

  return (
    <html>
      <body>
        <div>Error: {error.message}</div>
        <button onClick={reset}>Reset</button>
      </body>
    </html>
  );
}
