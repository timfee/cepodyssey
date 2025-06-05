"use client";
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SessionWarning } from "@/components/session-warning";
import { ConfigForm } from "@/components/form";
import { AuthStatus } from "@/components/auth";
import { AlertTriangleIcon } from "lucide-react";
import type { Session } from "next-auth";
import { useAppSelector } from "@/hooks/use-redux";

interface ActionToolbarProps {
  session: Session | null;
  isLoadingSession: boolean;
}

/**
 * Displays the user's authentication and configuration status along with any
 * required actions before automation can run.
 */
export function ActionToolbar({ session, isLoadingSession }: ActionToolbarProps) {
  const domain = useAppSelector((state) => state.app.domain);
  const tenantId = useAppSelector((state) => state.app.tenantId);
  const showActionRequired =
    (!domain ||
      !tenantId ||
      !session?.hasGoogleAuth ||
      !session?.hasMicrosoftAuth) &&
    !isLoadingSession;

  return (
    <>
      <SessionWarning />
      <ConfigForm />
      <AuthStatus />
      {showActionRequired && (
        <Alert
          variant="default"
          className="border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-200"
        >
          <AlertTriangleIcon className="h-5 w-5 !text-orange-500 dark:!text-orange-400" />
          <AlertTitle className="font-semibold">Action Required</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 space-y-1 list-disc pl-5">
              {!domain && !session?.authFlowDomain && (
                <li>Sign in with Google to detect your domain</li>
              )}
              {!tenantId && !session?.microsoftTenantId && (
                <li>Sign in with Microsoft to detect your Tenant ID</li>
              )}
              {(domain || session?.authFlowDomain) &&
                (tenantId || session?.microsoftTenantId) &&
                !session?.hasGoogleAuth && <li>Connect to Google Workspace.</li>}
              {(domain || session?.authFlowDomain) &&
                (tenantId || session?.microsoftTenantId) &&
                !session?.hasMicrosoftAuth && <li>Connect to Microsoft Entra ID.</li>}
            </ul>
            <p className="mt-2">Complete all requirements to continue</p>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
