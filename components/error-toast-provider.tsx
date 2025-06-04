"use client";

import { useEffect } from "react";
import { useErrorHandler } from "@/hooks/use-error-handler";

export function ErrorToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { handleError } = useErrorHandler();

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);

      if (
        event.reason?.message?.includes("API") &&
        event.reason?.message?.includes("not enabled")
      ) {
        handleError(new Error("Google Cloud API not enabled"), {
          stepTitle: "Unhandled Rejection",
        });
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, [handleError]);

  return <>{children}</>;
}
