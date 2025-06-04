"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export function SessionWarning() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 20 * 60 * 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <Alert className="mb-4">
      <InfoIcon className="h-4 w-4" />
      <AlertDescription>
        Your session tokens will refresh automatically, but for security, you
        may need to re-authenticate periodically. Save your progress regularly.
      </AlertDescription>
    </Alert>
  );
}
