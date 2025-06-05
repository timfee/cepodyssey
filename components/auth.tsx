"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppSelector } from "@/hooks/use-redux";
import {
  CheckCircle2Icon,
  ChromeIcon,
  CloudIcon,
  Loader2Icon,
  LogInIcon,
  XCircleIcon,
} from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useErrorHandler } from "@/hooks/use-error-handler";

/**
 * Displays the connection status for each provider and triggers sign-in.
 */
export function AuthStatus() {
  const { data: session, status } = useSession();
  const { domain, tenantId } = useAppSelector((state) => state.app);
  const { handleError } = useErrorHandler();

  const isConfigReady = !!domain && !!tenantId;
  const isLoading = status === "loading";

  const handleSignIn = (provider: "google" | "microsoft-entra-id") => {
    if (!isConfigReady) {
      handleError(new Error("Enter your domain and Tenant ID first"), {
        stepTitle: "Authentication",
      });
      return;
    }
    const options: { hd?: string; tenant?: string } = {};
    if (provider === "google") options.hd = domain!;
    if (provider === "microsoft-entra-id") options.tenant = tenantId!;

    signIn(provider, { callbackUrl: "/" }, options);
  };

  const renderPill = (
    providerName: string,
    Icon: React.ElementType,
    isConnected: boolean,
    onConnect: () => void,
  ) => (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4">
      <div className="flex items-center gap-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
        <div>
          <p className="font-semibold">{providerName}</p>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="h-4 w-4 animate-spin" />
              <span>Checking...</span>
            </div>
          ) : isConnected ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2Icon className="h-4 w-4" />
              <span>Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <XCircleIcon className="h-4 w-4" />
              <span>Not Connected</span>
            </div>
          )}
        </div>
      </div>
      {!isConnected && !isLoading && (
        <Button
          onClick={onConnect}
          disabled={!isConfigReady}
          title={
            !isConfigReady
              ? "Configuration required"
              : `Connect ${providerName}`
          }
        >
          <LogInIcon className="mr-2 h-4 w-4" />
          Connect
        </Button>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication Status</CardTitle>
        <CardDescription>
          Sign in as an admin to both Google and Microsoft
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderPill(
          "Google Workspace",
          ChromeIcon,
          session?.hasGoogleAuth ?? false,
          () => handleSignIn("google"),
        )}
        {renderPill(
          "Microsoft Entra ID",
          CloudIcon,
          session?.hasMicrosoftAuth ?? false,
          () => handleSignIn("microsoft-entra-id"),
        )}
      </CardContent>
    </Card>
  );
}
