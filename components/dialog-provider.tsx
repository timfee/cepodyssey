"use client";

import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { GoogleTokenModal } from "./google-token-modal";
import { StepDetailsModal } from "./step-details-modal";
import { StepOutputsDialog } from "./step-outputs-dialog";
import type { ManagedStep } from "@/lib/types";

interface DialogContextType {
  openGoogleTokenModal: (onComplete: () => void) => void;
  closeGoogleTokenModal: () => void;
  openStepDetailsModal: (
    step: ManagedStep,
    outputs: Record<string, unknown>,
  ) => void;
  closeStepDetailsModal: () => void;
  openStepOutputsModal: (
    step: ManagedStep,
    outputs: Record<string, unknown>,
    allStepsStatus: Record<string, { status: string }>,
  ) => void;
  closeStepOutputsModal: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [googleTokenModalOpen, setGoogleTokenModalOpen] = useState(false);
  const [googleTokenModalOnComplete, setGoogleTokenModalOnComplete] = useState<
    (() => void) | null
  >(null);

  const [stepDetailsModalOpen, setStepDetailsModalOpen] = useState(false);
  const [stepDetailsModalData, setStepDetailsModalData] = useState<{
    step: ManagedStep;
    outputs: Record<string, unknown>;
  } | null>(null);

  const [stepOutputsModalOpen, setStepOutputsModalOpen] = useState(false);
  const [stepOutputsModalData, setStepOutputsModalData] = useState<{
    step: ManagedStep;
    outputs: Record<string, unknown>;
    allStepsStatus: Record<string, { status: string }>;
  } | null>(null);

  const openGoogleTokenModal = (onComplete: () => void) => {
    setGoogleTokenModalOnComplete(() => onComplete);
    setGoogleTokenModalOpen(true);
  };

  const closeGoogleTokenModal = () => {
    setGoogleTokenModalOpen(false);
    setGoogleTokenModalOnComplete(null);
  };

  const openStepDetailsModal = (
    step: ManagedStep,
    outputs: Record<string, unknown>,
  ) => {
    setStepDetailsModalData({ step, outputs });
    setStepDetailsModalOpen(true);
  };

  const closeStepDetailsModal = () => {
    setStepDetailsModalOpen(false);
    setStepDetailsModalData(null);
  };

  const openStepOutputsModal = (
    step: ManagedStep,
    outputs: Record<string, unknown>,
    allStepsStatus: Record<string, { status: string }>,
  ) => {
    setStepOutputsModalData({ step, outputs, allStepsStatus });
    setStepOutputsModalOpen(true);
  };

  const closeStepOutputsModal = () => {
    setStepOutputsModalOpen(false);
    setStepOutputsModalData(null);
  };

  return (
    <DialogContext.Provider
      value={{
        openGoogleTokenModal,
        closeGoogleTokenModal,
        openStepDetailsModal,
        closeStepDetailsModal,
        openStepOutputsModal,
        closeStepOutputsModal,
      }}
    >
      {children}
      <GoogleTokenModal
        isOpen={googleTokenModalOpen}
        onClose={closeGoogleTokenModal}
        onComplete={() => {
          googleTokenModalOnComplete?.();
          closeGoogleTokenModal();
        }}
      />
      {stepDetailsModalData && (
        <StepDetailsModal
          step={stepDetailsModalData.step}
          outputs={stepDetailsModalData.outputs}
          isOpen={stepDetailsModalOpen}
          onClose={closeStepDetailsModal}
        />
      )}
      {stepOutputsModalData && (
        <StepOutputsDialog
          step={stepOutputsModalData.step}
          outputs={stepOutputsModalData.outputs}
          allStepsStatus={stepOutputsModalData.allStepsStatus}
          isOpen={stepOutputsModalOpen}
          onClose={closeStepOutputsModal}
        />
      )}
    </DialogContext.Provider>
  );
}

export const useDialogs = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialogs must be used within a DialogProvider");
  }
  return context;
};
