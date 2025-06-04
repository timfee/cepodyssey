"use client";

import { useAppSelector, useAppDispatch } from "@/hooks/use-redux";
import {
  selectStepDetailsModal,
  selectStepOutputsModal,
} from "@/lib/redux/slices/modals";
import { selectActiveError, dismissError } from "@/lib/redux/slices/errors";
import { StepDetailsModal } from "./step-details-modal";
import { StepOutputsDialog } from "./step-outputs-dialog";
import { ErrorDialog } from "@/components/ui/error-dialog";
import { useRouter } from "next/navigation";

export function ModalManager() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const stepDetailsModal = useAppSelector(selectStepDetailsModal);
  const stepOutputsModal = useAppSelector(selectStepOutputsModal);
  const activeError = useAppSelector(selectActiveError);

  const handleErrorDialogChange = (open: boolean) => {
    if (!open) {
      dispatch(dismissError());
    }
  };

  const enhancedError = activeError
    ? {
        ...activeError,
        actions: activeError.actions?.map((action) => ({
          ...action,
          onClick: () => {
            if (action.label === "Sign In") {
              router.push("/login");
            } else if (
              action.label === "Enable API" &&
              activeError.details?.apiUrl
            ) {
              window.open(activeError.details.apiUrl as string, "_blank");
            }
          },
        })),
      }
    : null;

  return (
    <>
      {stepDetailsModal.step && <StepDetailsModal />}
      {stepOutputsModal.step && <StepOutputsDialog />}
      {enhancedError && (
        <ErrorDialog
          error={enhancedError}
          open={!!enhancedError}
          onOpenChange={handleErrorDialogChange}
        />
      )}
    </>
  );
}
