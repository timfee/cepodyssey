"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "./loading-spinner";

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * Protects pages that require authentication and handles redirect logic
 * client-side to avoid exposing protected content.
 */
export function RouteGuard({ children, requireAuth = true }: RouteGuardProps) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && status === "unauthenticated") {
      router.replace("/login?reason=unauthenticated");
    }
  }, [requireAuth, status, router]);

  if (requireAuth && (status === "loading" || status === "unauthenticated")) {
    // Display a full-screen spinner while the auth status resolves or during
    // client-side redirects to avoid flashing the protected content.
    return <LoadingSpinner fullScreen />;
  }

  return <>{children}</>;
}
