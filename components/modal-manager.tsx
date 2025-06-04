"use client";

import { useAppSelector } from "@/hooks/use-redux";
import {
  selectGoogleTokenModal,
  selectStepDetailsModal,
  selectStepOutputsModal,
} from "@/lib/redux/slices/modals";
import { GoogleTokenModal } from "./google-token-modal";
import { StepDetailsModal } from "./step-details-modal";
import { StepOutputsDialog } from "./step-outputs-dialog";

/**
 * Centralized modal manager that renders all modals based on Redux state.
 * This component should be placed at the root level of the app.
 */
export function ModalManager() {
  const googleTokenModal = useAppSelector(selectGoogleTokenModal);
  const stepDetailsModal = useAppSelector(selectStepDetailsModal);
  const stepOutputsModal = useAppSelector(selectStepOutputsModal);

  return (
    <>
      <GoogleTokenModal />

      {stepDetailsModal.step && <StepDetailsModal />}

      {stepOutputsModal.step && <StepOutputsDialog />}
    </>
  );
}
