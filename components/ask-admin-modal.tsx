"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAppDispatch, useAppSelector } from "@/hooks/use-redux";
import {
  closeAskAdminModal,
  selectAskAdminModal,
} from "@/lib/redux/slices/ui-state";
import { useSession } from "next-auth/react";

export function AskAdminModal() {
  const dispatch = useAppDispatch();
  const { isOpen, step } = useAppSelector(selectAskAdminModal);
  const { data: session } = useSession();

  const [adminEmail, setAdminEmail] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  if (!step) return null;

  const handleClose = () => {
    dispatch(closeAskAdminModal());
    setAdminEmail("");
    setCustomMessage("");
  };

  const handleSend = async () => {
    if (!adminEmail) {
      alert("Please enter the admin's email address.");
      return;
    }
    setIsSending(true);
    console.log("Sending to:", adminEmail);
    console.log("Step:", step.title);
    console.log("Custom Message:", customMessage);
    console.log(
      "Generated Magic Link (example):",
      `https://yourapp.com/admin-assist?stepId=${step.id}&token=generated_token`,
    );
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSending(false);
    handleClose();
    alert(`Request sent to ${adminEmail}!`);
  };

  const renderMonospace = (text: string | undefined) =>
    text ? (
      <code className="font-mono text-xs bg-slate-200 p-0.5 rounded">
        {text}
      </code>
    ) : null;

  const userName = session?.user?.name || "A colleague";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Ask Admin for Help: {step.title}</DialogTitle>
          <DialogDescription>
            Enter your admin&apos;s email. They&apos;ll receive a message with a
            link to help complete this step. You can preview their experience
            below.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(80vh-200px)] pr-6">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="adminEmail" className="text-right">
                Admin&apos;s Email
              </Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="admin@example.com"
                className="col-span-3"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="border rounded-lg p-1 my-4 bg-slate-50 ">
            <h3 className="text-base font-semibold mb-2 text-center text-primary pt-3">
              Admin Preview
            </h3>
            <p className="text-xs text-muted-foreground mb-3 text-center px-4">
              This is a simulation of the information your admin will see when
              they click the magic link.
            </p>

            <div className="border rounded-md p-4 m-3 bg-white shadow-sm">
              <p className="mb-4 text-sm">
                <span className="font-semibold">{userName}</span> has requested
                your assistance to complete the following workflow step:
              </p>

              <div className="mb-4 p-3 border rounded-md bg-slate-50">
                <h4 className="text-lg font-semibold mb-1 text-foreground">
                  {step.title}
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Provider: <span className="font-medium">{step.provider}</span>{" "}
                  / Activity:{" "}
                  <span className="font-medium">{step.activity}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
              </div>

              <div className="space-y-3 text-sm mb-4">
                <div>
                  <h5 className="font-medium text-foreground/90 mb-0.5">
                    Technical Details:
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    {step.details}
                  </p>
                </div>

                {step.inputs && step.inputs.length > 0 && (
                  <div>
                    <h5 className="font-medium text-foreground/90 mb-0.5">
                      Inputs Required:
                    </h5>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 pl-4">
                      {step.inputs.map((input, index) => (
                        <li key={index}>
                          {input.type === "keyValue" ? (
                            <>
                              {renderMonospace(input.data.key)}
                              {input.data.description &&
                                ` (${input.data.description})`}
                            </>
                          ) : (
                            <>
                              Completion of: <strong>{input.stepTitle}</strong>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {step.actions && step.actions.length > 0 && (
                  <Alert variant="warning" className="my-3 text-left">
                    <AlertTriangleIcon className="h-4 w-4" />
                    <AlertTitle className="font-semibold mb-1">
                      System Actions This Step Will Perform:
                    </AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1 pl-4 mt-2">
                        {step.actions.map((action, index) => (
                          <li key={index}>
                            <code className="text-xs bg-amber-100 text-amber-800 p-1 rounded break-all">
                              {action}
                            </code>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-amber-600 mt-2">
                        Please review these actions carefully before proceeding.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-6 mb-2">
                To assist, please log in to the platform using your credentials.
                You will then be guided to this step.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mt-3 border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="w-full sm:w-auto"
                >
                  Log In to Platform
                </Button>
                <Button
                  size="sm"
                  disabled
                  className="w-full sm:w-auto bg-primary/80 text-primary-foreground/90"
                >
                  Execute Step: {step.title}
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-3">
                (These buttons are for preview purposes only)
              </p>
            </div>
          </div>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customMessage" className="text-right">
                Optional Message
              </Label>
              <Textarea
                id="customMessage"
                placeholder={`e.g., Hi Admin, I&apos;m not sure about the inputs for "${step.title}". Could you take a look?`}
                className="col-span-3"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isSending}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !adminEmail.trim()}
          >
            {isSending ? "Sending Request..." : "Send Request to Admin"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
