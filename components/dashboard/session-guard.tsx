"use client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2Icon, LogInIcon, AlertTriangleIcon } from "lucide-react";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useSessionSync } from "@/hooks/use-session-sync";
import { useAppSelector } from "@/hooks/use-redux";
import React from "react";

interface SessionGuardProps {
  serverSession: Session;
  children: (session: Session, isLoading: boolean) => React.ReactNode;
}

export function SessionGuard({ serverSession, children }: SessionGuardProps) {
  const { session, status } = useSessionSync();
  const appConfig = useAppSelector((state) => state.app);
  const isLoading = status === "loading";
  const currentSession = session ?? serverSession;

  if (isLoading && !currentSession) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2Icon className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  if (
    status === "authenticated" &&
    (!session?.hasGoogleAuth ||
      !session?.hasMicrosoftAuth ||
      (session?.error as unknown as string) === "MissingTokens" ||
      session?.error === "RefreshTokenError") &&
    (appConfig.domain || appConfig.tenantId)
  ) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
        <div className="mx-auto max-w-2xl">
          <Alert variant="destructive">
            <AlertTriangleIcon className="h-5 w-5" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              Your session is invalid. Please sign out completely and sign in
              again with both Google and Microsoft.
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-4 w-full"
            size="lg"
          >
            <LogInIcon className="mr-2 h-5 w-5" />
            Sign Out and Start Over
          </Button>
        </div>
      </div>
    );
  }

  return <>{children(currentSession, isLoading)}</>;
}
