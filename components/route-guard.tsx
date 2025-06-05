"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "./loading-spinner";

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function RouteGuard({ children, requireAuth = true }: RouteGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && requireAuth) {
      if (!session?.user) {
        router.replace("/login?reason=unauthenticated");
        return;
      }
      if (!session.hasGoogleAuth || !session.hasMicrosoftAuth) {
        const queryParams = new URLSearchParams();
        if (!session.hasGoogleAuth && !session.hasMicrosoftAuth) {
          queryParams.set("reason", "both_identities_missing");
        } else if (!session.hasGoogleAuth) {
          queryParams.set("reason", "google_auth_missing");
        } else {
          queryParams.set("reason", "microsoft_auth_missing");
        }
        router.replace(`/login?${queryParams.toString()}`);
      }
    }
  }, [status, router, session, requireAuth]);

  if (status === "loading") {
    return <LoadingSpinner fullScreen />;
  }

  if (
    requireAuth &&
    (!session?.user || !session.hasGoogleAuth || !session.hasMicrosoftAuth)
  ) {
    return null;
  }

  return <>{children}</>;
}
