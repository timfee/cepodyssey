import { useAppDispatch } from "./use-redux";
import { setError } from "@/lib/redux/slices/ui-state";

/**
 * Returns a helper for dispatching errors to the global error modal.
 */
export function useErrorHandler() {
  const dispatch = useAppDispatch();

  const handleError = (
    error: unknown,
    context?: { stepId?: string; stepTitle?: string },
  ) => {
    const message = error instanceof Error ? error.message : String(error);
    dispatch(
      setError({
        message,
        details: context,
      }),
    );
  };

  return { handleError };
}
