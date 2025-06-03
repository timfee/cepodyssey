"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function ErrorToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);

      if (
        event.reason?.message?.includes("API") &&
        event.reason?.message?.includes("not enabled")
      ) {
        toast.error("Google Cloud API not enabled", {
          description: "Check the console for details on which API to enable",
          duration: 10000,
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
  }, []);

  return <>{children}</>;
}
