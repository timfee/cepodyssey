"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/hooks/use-redux";
import { selectStepDetailsModal, closeStepDetailsModal } from "@/lib/redux/slices/modals";

export function StepDetailsModal() {
  const dispatch = useAppDispatch();
  const { isOpen, step, outputs } = useAppSelector(selectStepDetailsModal);

  if (!step) return null;

  const handleClose = () => {
    dispatch(closeStepDetailsModal());
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{step.title}</DialogTitle>
          <DialogDescription>{step.description}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {step.message && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold mb-2">Instructions</h4>
              <p className="text-sm whitespace-pre-line">{step.message}</p>
            </div>
          )}

          {step.adminUrls && (
            <div className="flex gap-2">
              {step.adminUrls.configure && (
                <Button variant="outline" asChild>
                  <a
                    href={
                      typeof step.adminUrls.configure === "function"
                        ? (step.adminUrls.configure(outputs) ?? "#")
                        : step.adminUrls.configure
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLinkIcon className="mr-2 h-4 w-4" />
                    Open Admin Console
                  </a>
                </Button>
              )}
            </div>
          )}

          {step.metadata?.resourceUrl && (
            <Button variant="outline" asChild>
              <a
                href={step.metadata.resourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLinkIcon className="mr-2 h-4 w-4" />
                View Resource
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
