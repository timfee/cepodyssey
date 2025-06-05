"use client";

import { useEffect } from "react";
import type { ReactElement } from "react";
import { useAppDispatch } from "@/hooks/use-redux";
import { setError } from "@/lib/redux/slices/ui-state";
import { Logger } from "@/lib/utils/logger";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactElement | null {
  const dispatch = useAppDispatch();

  useEffect(() => {
    Logger.error('[RouteError]', 'Route error:', error);

    const message = error.message || "An unexpected error occurred";
    dispatch(setError({ message, details: { digest: error.digest } }));
  }, [error, dispatch, reset]);

  // Return null since error dialog will show
  return null;
}
