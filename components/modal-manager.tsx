"use client";

import { useAppSelector } from "@/hooks/use-redux";
import { selectStepDetailsModal } from "@/lib/redux/slices/modals";
import { StepDetailsModal } from "./step-details-modal";

export function ModalManager() {
  const stepDetailsModal = useAppSelector(selectStepDetailsModal);

  return (
    <>
      {stepDetailsModal.step && <StepDetailsModal />}
    </>
  );
}
