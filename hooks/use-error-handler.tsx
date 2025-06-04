import { useAppDispatch } from "./use-redux";
import { showError } from "@/lib/redux/slices/errors";
import { isAuthenticationError } from "@/lib/api/auth-interceptor";
import { APIError } from "@/lib/api/utils";
import { useRouter } from "next/navigation";
import { LogInIcon, ExternalLinkIcon } from "lucide-react";

export function useErrorHandler() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleError = (error: unknown, context?: { stepId?: string; stepTitle?: string }) => {
    if (isAuthenticationError(error)) {
      dispatch(showError({
        error: {
          title: "Authentication Required",
          message: `Your ${error.provider === "google" ? "Google Workspace" : "Microsoft"} session has expired.`,
          code: "AUTH_EXPIRED",
          provider: error.provider,
          actions: [{
            label: "Sign In",
            onClick: () => router.push("/login"),
            variant: "default",
            icon: <LogInIcon className="mr-2 h-4 w-4" />
          }]
        },
        dismissible: true
      }));
      return;
    }

    if (error instanceof APIError && error.code === "API_NOT_ENABLED") {
      const enableUrlMatch = error.message?.match(
        /https:\/\/console\.developers\.google\.com[^\s]+/,
      );
      const enableUrl = enableUrlMatch ? enableUrlMatch[0] : null;

      dispatch(showError({
        error: {
          title: "Google Cloud API Not Enabled",
          message: "Enable the required API to continue.",
          code: "API_NOT_ENABLED",
          details: { apiUrl: enableUrl },
          actions: enableUrl ? [{
            label: "Enable API",
            onClick: () => window.open(enableUrl, "_blank"),
            variant: "default",
            icon: <ExternalLinkIcon className="mr-2 h-4 w-4" />
          }] : []
        },
        dismissible: true
      }));
      return;
    }

    const message = error instanceof Error ? error.message : String(error);
    dispatch(showError({
      error: {
        title: context?.stepTitle ? `${context.stepTitle} Failed` : "Operation Failed",
        message,
        code: "UNKNOWN_ERROR",
        details: context
      },
      dismissible: true
    }));
  };

  return { handleError };
}
