"use client";

import { useAppSelector, useAppDispatch } from "@/hooks/use-redux";
import {
  selectStepDetailsModal,
  selectStepOutputsModal,
} from "@/lib/redux/slices/modals";
import { selectActiveError, dismissError, ErrorActionType } from "@/lib/redux/slices/errors";
import { StepDetailsModal } from "./step-details-modal";
import { StepOutputsDialog } from "./step-outputs-dialog";
import { ErrorDialog } from "@/components/ui/error-dialog";

export function ModalManager() {
  const dispatch = useAppDispatch();
  const stepDetailsModal = useAppSelector(selectStepDetailsModal);
  const stepOutputsModal = useAppSelector(selectStepOutputsModal);
  const activeError = useAppSelector(selectActiveError);

  const handleErrorDialogChange = (open: boolean) => {
    if (!open) {
      dispatch(dismissError());
    }
  };

  return (
    <>
      {stepDetailsModal.step && <StepDetailsModal />}
      {stepOutputsModal.step && <StepOutputsDialog />}
      {activeError && (
        <ErrorDialog
          error={activeError}
          open={!!activeError}
          onOpenChange={handleErrorDialogChange}
        />
      )}
    </>
  );
}
