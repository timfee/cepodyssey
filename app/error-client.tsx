"use client";
import type { ReactElement } from "react";

/**
 * Displays an error message for route-level errors.
 */
export function ErrorDisplay({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}): ReactElement {
  return (
    <div>
      <h2>Error: {error.message}</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
