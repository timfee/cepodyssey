"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLinkIcon } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/hooks/use-redux";
import {
  selectStepDetailsModal,
  closeStepDetailsModal,
} from "@/lib/redux/slices/ui-state";

export function StepDetailsModal() {
  const dispatch = useAppDispatch();
  const { isOpen, step, outputs } = useAppSelector(selectStepDetailsModal);

  if (!step) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => dispatch(closeStepDetailsModal())}
    >
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{step.title}</DialogTitle>
          <DialogDescription>{step.description}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {step.message && (
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-2">Instructions</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {step.message}
                  </p>
                </CardContent>
              </Card>
            )}

            {(step.adminUrls || step.metadata?.resourceUrl) && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {step.adminUrls?.configure && (
                    <Button variant="outline" size="sm" asChild>
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
                        Admin Console
                      </a>
                    </Button>
                  )}

                  {step.metadata?.resourceUrl && (
                    <Button variant="outline" size="sm" asChild>
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
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
