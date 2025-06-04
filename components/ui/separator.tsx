import { cn } from "@/lib/utils";
import * as React from "react";

export function Separator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="separator"
      className={cn("h-px w-full bg-border", className)}
      {...props}
    />
  );
}
