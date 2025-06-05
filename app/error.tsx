import { ErrorDisplay } from "./error-client";
import { Logger } from "@/lib/utils/logger";
import type { ReactElement } from "react";

/**
 * Server boundary for route errors.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}): ReactElement {
  Logger.error('[RouteError]', 'Route error:', error);
  return <ErrorDisplay error={error} reset={reset} />;
}
