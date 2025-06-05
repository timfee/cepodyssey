"use client";
import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  className?: string;
}

export function LoadingSpinner({ fullScreen, className }: LoadingSpinnerProps) {
  const spinner = (
    <Loader2Icon className={cn("h-8 w-8 animate-spin text-primary", className)} />
  );

  if (fullScreen) {
    return (
      <div className="flex h-screen items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
