"use client";

import { useAppSelector } from "@/hooks/use-redux";
import {
  selectStepDetailsModal,
  selectStepOutputsModal,
} from "@/lib/redux/slices/modals";
import { StepDetailsModal } from "./step-details-modal";
import { StepOutputsDialog } from "./step-outputs-dialog";

/**
 * Centralized modal manager that renders all modals based on Redux state.
 * This component should be placed at the root level of the app.
 */
export function ModalManager() {
  const stepDetailsModal = useAppSelector(selectStepDetailsModal);
  const stepOutputsModal = useAppSelector(selectStepOutputsModal);

  return (
    <>
      {stepDetailsModal.step && <StepDetailsModal />}

      {stepOutputsModal.step && <StepOutputsDialog />}
    </>
  );
}
