'use client';

import { Button } from '@/components/ui/button';
import type { ManagedStep } from './workflow-types';
import {
  ExternalLink,
  Loader2,
  Lock,
  RefreshCw,
  UserCheck,
  Zap,
} from 'lucide-react';
import { useMemo } from 'react';

interface StepCardFooterActionsProps {
  step: ManagedStep;
  isBlocked: boolean;
  isCompleted: boolean;
  isProcessing: boolean;
  canExecute: boolean;
  allOutputs: Record<string, unknown>;
  onExecute: () => void;
  onMarkComplete: () => void;
  onMarkIncomplete: () => void;
  onRequestAdmin: () => void;
}

export function StepCardFooterActions({
  step,
  isBlocked,
  isCompleted,
  isProcessing,
  canExecute,
  allOutputs,
  onExecute,
  onMarkComplete,
  onMarkIncomplete,
  onRequestAdmin,
}: StepCardFooterActionsProps) {
  const configureUrl = useMemo(() => {
    if (!step.adminUrls?.configure) return undefined;
    if (typeof step.adminUrls.configure === 'function') {
      return step.adminUrls.configure(allOutputs) || '#';
    }
    return step.adminUrls.configure;
  }, [step.adminUrls, allOutputs]);

  if (isBlocked) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Lock className="mr-1.5 h-4 w-4 shrink-0" />
        <span>Complete prerequisite steps first.</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {isCompleted ? (
          <>
            {step.automatability !== 'manual' && (
              <Button variant="outline" size="sm" onClick={onExecute} disabled={isProcessing}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Re-run
              </Button>
            )}
            {step.automatability === 'manual' &&
              step.completionType === 'user-marked' && (
                <Button variant="outline" size="sm" onClick={onMarkIncomplete} disabled={isProcessing}>
                  Mark as Incomplete
                </Button>
              )}
          </>
        ) : (
          <>
            <Button
              size="sm"
              onClick={step.automatability !== 'manual' ? onExecute : onMarkComplete}
              disabled={!canExecute || isProcessing}
              variant={step.automatability === 'manual' ? 'outline' : 'default'}
            >
              {isProcessing ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : step.automatability !== 'manual' ? (
                <Zap className="mr-1.5 h-4 w-4" />
              ) : (
                <UserCheck className="mr-1.5 h-4 w-4" />
              )}
              {isProcessing
                ? 'Processing...'
                : step.automatability !== 'manual'
                  ? step.status === 'failed'
                    ? 'Retry'
                    : 'Execute'
                  : 'Mark as Complete'}
            </Button>
            {step.automatability !== 'manual' && step.status !== 'failed' && (
              <Button
                variant="link"
                size="sm"
                className="px-2 text-xs text-muted-foreground hover:text-primary"
                onClick={onRequestAdmin}
              >
                Request from Admin
              </Button>
            )}
          </>
        )}
      </div>
      {configureUrl && (
        <Button
          variant="link"
          size="sm"
          asChild
          className="ml-auto p-0 text-xs text-muted-foreground hover:text-primary"
        >
          <a href={configureUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1 h-3 w-3" /> Configure
          </a>
        </Button>
      )}
    </>
  );
}
