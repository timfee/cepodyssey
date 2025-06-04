'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/use-redux';
import { clearError, selectError } from '@/lib/redux/slices/errors';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function GlobalErrorModal() {
  const dispatch = useAppDispatch();
  const error = useAppSelector(selectError);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(!!error.message);
  }, [error]);

  const handleDismiss = () => {
    dispatch(clearError());
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDismiss}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Error</DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-2">
          <p>{error.message}</p>
          {error.details != null && (
            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs whitespace-pre-wrap">
              {JSON.stringify(error.details, null, 2)}
            </pre>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleDismiss}>Dismiss</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
