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
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && status === "unauthenticated") {
      router.replace("/login?reason=unauthenticated");
    }
  }, [requireAuth, status, router]);

  if (requireAuth && status === "loading") {
    return <LoadingSpinner fullScreen />;
  }

  return <>{children}</>;
}
