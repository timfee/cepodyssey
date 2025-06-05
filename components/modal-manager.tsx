"use client";

import { useAppSelector } from "@/hooks/use-redux";
import {
  selectStepDetailsModal,
  selectAskAdminModal,
} from "@/lib/redux/slices/modals";
import { StepDetailsModal } from "./step-details-modal";
import { AskAdminModal } from "./ask-admin-modal";

export function ModalManager() {
  const stepDetailsModal = useAppSelector(selectStepDetailsModal);
  const askAdminModal = useAppSelector(selectAskAdminModal);

  return (
    <>
      {stepDetailsModal.step && <StepDetailsModal />}
      {askAdminModal.step && <AskAdminModal />}
    </>
  );
}
