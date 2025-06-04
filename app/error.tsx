"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/hooks/use-redux";
import { showError, ErrorActionType } from "@/lib/redux/slices/errors";
import { isAuthenticationError } from "@/lib/api/auth-interceptor";
import { APIError } from "@/lib/api/utils";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    console.error("Route error:", error);

    if (isAuthenticationError(error)) {
      dispatch(
        showError({
          error: {
            title: "Authentication Required",
            message: error.message,
            code: "AUTH_EXPIRED",
            provider: error.provider,
            actions: [
              {
                type: ErrorActionType.SIGN_IN,
                label: "Sign In",
                variant: "default",
                icon: "LogInIcon",
              },
            ],
          },
          dismissible: false,
        }),
      );
    } else if (
      error instanceof APIError &&
      error.message?.includes("has not been used in project")
    ) {
      const apiMatch = error.message.match(
        /https:\/\/console\.developers\.google\.com[^\s]+/,
      );
      const enableUrl = apiMatch ? apiMatch[0] : null;

      dispatch(
        showError({
          error: {
            title: "Enable this Google API",
            message: "A required Google Cloud API is not enabled for your project.",
            code: "API_NOT_ENABLED",
            details: { enableUrl },
            actions: enableUrl
              ? [
                  {
                    type: ErrorActionType.ENABLE_API,
                    label: "Enable API",
                    variant: "default",
                    icon: "ExternalLinkIcon",
                    payload: { url: enableUrl },
                  },
                  {
                    type: ErrorActionType.RETRY_STEP,
                    label: "Retry",
                    variant: "outline",
                    icon: "RefreshCwIcon",
                    payload: { callback: reset },
                  },
                ]
              : [],
          },
          dismissible: true,
        }),
      );
    } else {
      // For unhandled errors, show a basic error UI
      dispatch(
        showError({
          error: {
            title: "Something went wrong",
            message: error.message || "An unexpected error occurred",
            code: "UNHANDLED_ERROR",
            actions: [
              {
                type: ErrorActionType.RETRY_STEP,
                label: "Try again",
                variant: "default",
                icon: "RefreshCwIcon",
                payload: { callback: reset },
              },
            ],
          },
          dismissible: true,
        }),
      );
    }
  }, [error, dispatch, reset]);

  // Return null since error dialog will show
  return null;
}
