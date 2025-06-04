"use client";

import { useAppSelector } from "@/hooks/use-redux";
import {
  selectStepDetailsModal,
  selectStepOutputsModal,
} from "@/lib/redux/slices/modals";
import { StepDetailsModal } from "./step-details-modal";
import { StepOutputsDialog } from "./step-outputs-dialog";

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
