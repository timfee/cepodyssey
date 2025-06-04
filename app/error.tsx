"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/hooks/use-redux";
import { setError } from "@/lib/redux/slices/errors";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    console.error("Route error:", error);

    const message = error.message || "An unexpected error occurred";
    dispatch(setError({ message, details: { digest: error.digest } }));
  }, [error, dispatch, reset]);

  // Return null since error dialog will show
  return null;
}
