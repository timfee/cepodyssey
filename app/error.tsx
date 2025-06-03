'use client';

import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangleIcon, LogInIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { isAuthenticationError } from "@/lib/api/auth-interceptor";
import { APIError } from "@/lib/api/utils";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  if (error instanceof APIError && error.message?.includes('has not been used in project')) {
    const apiMatch = error.message.match(/https:\/\/console\.developers\.google\.com[^\s]+/);
    const enableUrl = apiMatch ? apiMatch[0] : null;

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangleIcon className="h-5 w-5" />
              API Not Enabled
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              A required Google Cloud API is not enabled for your project.
            </p>
            {enableUrl && (
              <div className="space-y-2">
                <Button onClick={() => window.open(enableUrl, '_blank')} className="w-full">
                  Enable API
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  After enabling, wait 2-3 minutes before retrying
                </p>
              </div>
            )}
            <Button onClick={reset} variant="outline" className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAuthenticationError(error)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-orange-500" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your session has expired. Please sign in again to continue.
            </p>
            <Button onClick={() => router.push('/login')} className="w-full">
              <LogInIcon className="mr-2 h-4 w-4" />
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            {error.message || 'An unexpected error occurred'}
          </p>
          <Button onClick={reset} className="w-full">
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
