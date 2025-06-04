"use client";

import { useAppSelector } from "@/hooks/use-redux";
import {
  selectStepDetailsModal,
  selectStepOutputsModal,
} from "@/lib/redux/slices/modals";
import { StepDetailsDialog } from "./step-details-dialog";
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
      {stepDetailsModal.step && <StepDetailsDialog />}

      {stepOutputsModal.step && <StepOutputsDialog />}
    </>
  );
}
