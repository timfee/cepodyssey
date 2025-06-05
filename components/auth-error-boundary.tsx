"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticationError } from "@/lib/api/auth-errors";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangleIcon, LogInIcon } from "lucide-react";
import { Provider } from "@/lib/constants/enums";

interface AuthErrorBoundaryProps {
  error: Error;
  reset: () => void;
  children?: React.ReactNode;
}

export function AuthErrorBoundary({
  error,
  reset,
  children,
}: AuthErrorBoundaryProps) {
  const router = useRouter();
  const { handleError } = useErrorHandler();

  useEffect(() => {
    if (isAuthenticationError(error)) {
      handleError(error, { stepTitle: "Authentication" });
    }
  }, [error, router, handleError]);

  if (isAuthenticationError(error)) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5 text-orange-500" />
            Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your{" "}
            {error.provider === Provider.GOOGLE
              ? "Google Workspace"
              : "Microsoft"}{" "}
            session has expired. Please sign in again to continue.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/login")} className="flex-1">
              <LogInIcon className="mr-2 h-4 w-4" />
              Sign in
            </Button>
            <Button onClick={reset} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
