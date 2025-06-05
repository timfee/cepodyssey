'use client';

import { useAppDispatch, useAppSelector } from '@/hooks/use-redux';
import { clearError, selectError, selectHasError } from '@/lib/redux/slices/errors';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangleIcon, LogInIcon, ExternalLinkIcon } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function GlobalErrorModal() {
  const dispatch = useAppDispatch();
  const error = useAppSelector(selectError);
  const hasError = useAppSelector(selectHasError);
  const router = useRouter();

  const handleDismiss = () => {
    dispatch(clearError());
  };

  const handleSignIn = async () => {
    // Sign out first to clear any stale tokens
    await signOut({ redirect: false });
    router.push('/login');
    handleDismiss();
  };

  const handleEnableAPI = () => {
    const details = error.details as { apiUrl?: string } | undefined;
    if (details?.apiUrl) {
      window.open(details.apiUrl, '_blank');
    }
    handleDismiss();
  };

  if (!hasError) return null;

  const details = error.details as
    | {
        recoverable?: boolean;
        action?: { label: string; handler: () => void };
        category?: string;
        code?: string;
        provider?: 'google' | 'microsoft';
        apiUrl?: string;
      }
    | undefined;

  const isAuthError = details?.category === 'auth' || details?.code === 'AUTH_EXPIRED';
  const isAPIEnablementError = details?.code === 'API_NOT_ENABLED';

  return (
    <Dialog open={hasError} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5 text-destructive" />
            {isAuthError ? 'Authentication Required' : 'Error'}
          </DialogTitle>
          {details?.category && (
            <DialogDescription>
              {details.category === 'auth' && 'Your session has expired'}
              {details.category === 'api' && 'API Error'}
              {details.category === 'validation' && 'Validation Error'}
              {details.category === 'system' && 'System Error'}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm">{error.message}</p>
          {isAuthError && details?.provider && (
            <p className="text-sm text-muted-foreground mt-2">
              Provider: {details.provider === 'google' ? 'Google Workspace' : 'Microsoft Entra ID'}
            </p>
          )}
        </div>
        <DialogFooter className="flex gap-2 sm:justify-between">
          {isAuthError ? (
            <>
              <Button 
                onClick={handleSignIn} 
                className="flex-1"
              >
                <LogInIcon className="h-4 w-4 mr-2" />
                Sign In Again
              </Button>
              <Button 
                onClick={handleDismiss} 
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </>
          ) : isAPIEnablementError && details?.apiUrl ? (
            <>
              <Button 
                onClick={handleEnableAPI}
                className="flex-1"
              >
                <ExternalLinkIcon className="h-4 w-4 mr-2" />
                Enable API
              </Button>
              <Button 
                onClick={handleDismiss} 
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={handleDismiss} className="w-full">
              Dismiss
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
