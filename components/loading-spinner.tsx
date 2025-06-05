"use client";

import { Loader2Icon } from "lucide-react";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
}

export function LoadingSpinner({ fullScreen = false }: LoadingSpinnerProps) {
  const wrapperClass = fullScreen
    ? "flex h-screen items-center justify-center"
    : "flex items-center justify-center";

  return (
    <div className={wrapperClass}>
      <Loader2Icon className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
