"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { isAuthenticationError } from "@/lib/api/auth-interceptor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangleIcon, LogInIcon } from "lucide-react";

interface AuthErrorBoundaryProps {
  error: Error;
  reset: () => void;
  children?: React.ReactNode;
}

export function AuthErrorBoundary({ error, reset, children }: AuthErrorBoundaryProps) {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticationError(error)) {
      toast.error(`Authentication expired: ${error.provider}`, {
        duration: 10000,
        action: {
          label: "Sign In",
          onClick: () => router.push("/login"),
        },
      });
    }
  }, [error, router]);

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
            Your {error.provider === "google" ? "Google Workspace" : "Microsoft"} session has expired.
            Please sign in again to continue.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/login")} className="flex-1">
              <LogInIcon className="mr-2 h-4 w-4" />
              Go to Login
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
