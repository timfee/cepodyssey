"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/hooks/use-redux";
import {
  clearError,
  selectError,
  selectHasError,
} from "@/lib/redux/slices/ui-state";
import { AlertTriangleIcon, ExternalLinkIcon, LogInIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Provider } from "@/lib/constants/enums";

export function GlobalErrorModal() {
  const dispatch = useAppDispatch();
  const error = useAppSelector(selectError);
  const hasError = useAppSelector(selectHasError);
  const router = useRouter();

  const handleDismiss = () => {
    dispatch(clearError());
  };

  const handleSignIn = async () => {
    await signOut({ redirect: false });
    router.push("/login");
    handleDismiss();
  };

  const handleEnableAPI = () => {
    const urlMatch = error.message.match(/https:\/\/[^\s]+/);
    if (urlMatch) {
      window.open(urlMatch[0], "_blank");
    }
    handleDismiss();
  };

  if (!hasError) return null;

  const details = error.details as
    | {
        category?: string;
        code?: string;
        provider?: "google" | "microsoft";
      }
    | undefined;

  const isAuthError =
    details?.category === "auth" || details?.code === "AUTH_EXPIRED";
  const isAPIEnablementError = details?.code === "API_NOT_ENABLED";

  return (
    <Dialog open={hasError} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5 text-destructive" />
            {isAuthError
              ? "Authentication Required"
              : isAPIEnablementError
                ? "API Not Enabled"
                : "Error"}
          </DialogTitle>
          <DialogDescription>
            {isAuthError
              ? "Your session has expired or is invalid."
              : "An error occurred that requires your attention."}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm">{error.message}</p>
          {isAuthError && details?.provider && (
            <p className="mt-2 text-sm text-muted-foreground">
              Provider:{" "}
              {details.provider === Provider.GOOGLE
                ? "Google Workspace"
                : "Microsoft Entra ID"}
            </p>
          )}
        </div>
        <DialogFooter className="flex gap-2 sm:justify-end">
          {isAuthError ? (
            <>
              <Button onClick={handleDismiss} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSignIn}>
                <LogInIcon className="mr-2 h-4 w-4" />
                Sign In Again
              </Button>
            </>
          ) : isAPIEnablementError ? (
            <>
              <Button onClick={handleDismiss} variant="outline">
                Dismiss
              </Button>
              <Button onClick={handleEnableAPI}>
                <ExternalLinkIcon className="mr-2 h-4 w-4" />
                Enable API
              </Button>
            </>
          ) : (
            <Button onClick={handleDismiss} className="w-full">
              Dismiss
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
