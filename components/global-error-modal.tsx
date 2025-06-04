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
import { AlertTriangleIcon } from 'lucide-react';

export function GlobalErrorModal() {
  const dispatch = useAppDispatch();
  const error = useAppSelector(selectError);
  const hasError = useAppSelector(selectHasError);

  const handleDismiss = () => {
    dispatch(clearError());
  };

  const handleAction = () => {
    const action = details?.action;
    if (action?.handler) {
      action.handler();
    }
    handleDismiss();
  };

  if (!hasError) return null;

  const details = error.details as
    | {
        recoverable?: boolean;
        action?: { label: string; handler: () => void };
        category?: string;
      }
    | undefined;

  const isRecoverable = details?.recoverable;
  const action = details?.action;

  return (
    <Dialog open={hasError} onOpenChange={handleDismiss}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5 text-destructive" />
            Error
          </DialogTitle>
          {details && details.category && (
            <DialogDescription>
              {details.category === 'auth' && 'Authentication Required'}
              {details.category === 'api' && 'API Error'}
              {details.category === 'validation' && 'Validation Error'}
              {details.category === 'system' && 'System Error'}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="p-4 space-y-2">
          <p>{error.message}</p>
          {details && Object.keys(details).length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-muted-foreground">Technical Details</summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {JSON.stringify(details, null, 2)}
              </pre>
            </details>
          )}
        </div>
        <DialogFooter>
          {action && (
            <Button onClick={handleAction} variant="default">
              {action.label}
            </Button>
          )}
          <Button onClick={handleDismiss} variant={action ? 'outline' : 'default'}>
            {isRecoverable ? 'Close' : 'Dismiss'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
