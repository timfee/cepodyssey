"use client";

import React, { createContext, useContext, useState, type ReactNode } from "react";
import { GoogleTokenModal } from "./google-token-modal";
import { StepDetailsModal } from "./step-details-modal";
import type { ManagedStep } from "@/lib/types";

interface DialogContextType {
  openGoogleTokenModal: (onComplete: () => void) => void;
  closeGoogleTokenModal: () => void;
  openStepDetailsModal: (
    step: ManagedStep,
    outputs: Record<string, unknown>,
  ) => void;
  closeStepDetailsModal: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [googleTokenModalOpen, setGoogleTokenModalOpen] = useState(false);
  const [googleTokenModalOnComplete, setGoogleTokenModalOnComplete] =
    useState<(() => void) | null>(null);

  const [stepDetailsModalOpen, setStepDetailsModalOpen] = useState(false);
  const [stepDetailsModalData, setStepDetailsModalData] = useState<{
    step: ManagedStep;
    outputs: Record<string, unknown>;
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

  return (
    <DialogContext.Provider
      value={{
        openGoogleTokenModal,
        closeGoogleTokenModal,
        openStepDetailsModal,
        closeStepDetailsModal,
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
