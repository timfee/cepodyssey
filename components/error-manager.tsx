"use client";

import { useAppSelector, useAppDispatch } from "@/hooks/use-redux";
import {
  selectActiveError,
  selectErrorDismissible,
  dismissError,
} from "@/lib/redux/slices/errors";
import { ErrorDialog } from "@/components/ui/error-dialog";

/**
 * Global error manager that displays error dialogs based on Redux state.
 *
 * @returns Error manager component
 */
export function ErrorManager() {
  const dispatch = useAppDispatch();
  const activeError = useAppSelector(selectActiveError);
  const isDismissible = useAppSelector(selectErrorDismissible);

  if (!activeError) return null;

  return (
    <ErrorDialog
      error={activeError}
      open={true}
      onOpenChange={(open) => {
        if (!open && isDismissible) {
          dispatch(dismissError());
        }
      }}
      isDismissible={isDismissible}
    />
  );
}
