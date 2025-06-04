"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppSelector } from "@/hooks/use-redux";
import { OUTPUT_KEYS } from "@/lib/types";
import { getGoogleSamlProfileUrl } from "@/lib/utils";
import {
  CheckCircle2Icon,
  CopyIcon,
  ExternalLinkIcon,
  InfoIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface GoogleTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function GoogleTokenModal({
  isOpen,
  onClose,
  onComplete,
}: GoogleTokenModalProps) {
  const outputs = useAppSelector((state) => state.appConfig.outputs);
  const [token, setToken] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const isTokenFormatValid = token.length > 50 && !token.includes(" ");

  const handleSaveToken = async () => {
    if (!isTokenFormatValid) {
      toast.error("Please enter a valid token");
      return;
    }
    setIsValidating(true);

    // Token no longer stored in global configuration; handled manually

    toast.success("Google provisioning token saved successfully!");

    setTimeout(() => {
      setIsValidating(false);
      onComplete();
      onClose();
    }, 500);
  };

  const steps = [
    { num: 1, text: "Sign in to Google Admin Console" },
    {
      num: 2,
      text: "Navigate to: Security > Authentication > SSO with third party IdP",
    },
    { num: 3, text: "Find your 'Azure AD SSO' profile" },
    { num: 4, text: "Click on the profile to open it" },
    { num: 5, text: "Look for 'Automatic user provisioning' section" },
    { num: 6, text: "Click 'SET UP AUTOMATIC USER PROVISIONING'" },
    { num: 7, text: "Copy the 'Authorization token' value" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Get Google Workspace Provisioning Token</DialogTitle>
          <DialogDescription>
            Follow these steps to retrieve the secret token from Google Admin
            Console
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              This token allows Azure AD to create and manage users in your
              Google Workspace. Google requires this to be set up manually for
              security reasons.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h4 className="font-medium">Step-by-step instructions:</h4>

            <div className="space-y-2">
              {steps.map((step) => (
                <div key={step.num} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-medium">
                    {step.num}
                  </div>
                  <p className="text-sm">{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-sm">Quick Links:</h5>
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  const profileName = outputs?.[
                    OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME
                  ] as string;
                  const url = profileName
                    ? getGoogleSamlProfileUrl(profileName)
                    : "https://admin.google.com/ac/security/sso";
                  window.open(url, "_blank");
                }}
              >
                <ExternalLinkIcon className="mr-2 h-4 w-4" />
                Open Your SAML Profile
              </Button>
              <div className="text-xs text-muted-foreground">
                The token will look like:{" "}
                <code className="font-mono bg-white dark:bg-gray-800 px-1 py-0.5 rounded">
                  2.MqPt7f3qkV0IFG...
                </code>
              </div>
            </div>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="token">Paste the Authorization Token here:</Label>
            <div className="flex gap-2">
              <Input
                id="token"
                type="password"
                placeholder="Enter the token from Google Admin Console"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigator.clipboard.readText().then(setToken)}
                title="Paste from clipboard"
              >
                <CopyIcon className="h-4 w-4" />
              </Button>
            </div>
            {token && !isTokenFormatValid && (
              <p className="text-xs text-red-500">
                Token appears invalid. It should be a long string without
                spaces.
              </p>
            )}
            {token && isTokenFormatValid && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2Icon className="h-3 w-3" />
                Token format looks valid
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveToken}
            disabled={!isTokenFormatValid || isValidating}
          >
            {isValidating ? "Saving..." : "Save Token"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
