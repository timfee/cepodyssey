"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { isAuthenticationError } from "@/lib/api/auth-interceptor";
import { APIError } from "@/lib/api/utils";
import { useAppDispatch } from "@/hooks/use-redux";
import { showError } from "@/lib/redux/slices/errors";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
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
                label: "Sign In",
                onClick: () => router.push("/login"),
                variant: "default",
              },
            ],
          },
          dismissible: false, // Can't dismiss, must sign in
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
            message:
              "A required Google Cloud API is not enabled for your project.",
            code: "API_NOT_ENABLED",
            details: { enableUrl },
            actions: enableUrl
              ? [
                  {
                    label: "Enable API",
                    onClick: () => window.open(enableUrl, "_blank"),
                    variant: "default",
                  },
                  {
                    label: "Retry",
                    onClick: reset,
                    variant: "outline",
                  },
                ]
              : [
                  {
                    label: "Retry",
                    onClick: reset,
                    variant: "default",
                  },
                ],
          },
          dismissible: true,
        }),
      );
    }
  }, [error, router, dispatch, reset]);

  // Show a fallback UI for non-handled errors
  if (!isAuthenticationError(error) && !(error instanceof APIError)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-red-500" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {error.message || "An unexpected error occurred"}
            </p>
            <Button onClick={reset} className="w-full">
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For handled errors, return null as the error dialog will show
  return null;
}
