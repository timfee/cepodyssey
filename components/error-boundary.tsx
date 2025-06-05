"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangleIcon } from "lucide-react";
import { Logger } from "@/lib/utils/logger";

/**
 * Display a fallback UI when a child component throws an error.
 * Provides a retry button that invokes the passed reset handler.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Logger.error('[ErrorBoundary]', 'Unhandled error', error);
  }, [error]);

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
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
