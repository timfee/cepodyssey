'use client';

import { cn } from '@/lib/utils';
import type { DisplayOutput } from './workflow-types';
import { formatValue } from './utils';

interface StepCardOutputsDisplayProps {
  outputs: DisplayOutput[];
}

export function StepCardOutputsDisplay({
  outputs,
}: StepCardOutputsDisplayProps) {
  if (!outputs || outputs.length === 0) return null;

  return (
    <div className="grid rounded border border-border bg-card text-sm">
      <div className="grid grid-cols-2 bg-muted/50 px-2 py-1.5 font-medium text-muted-foreground">
        <div>Variable</div>
        <div>Value</div>
      </div>
      {outputs.map((output, index) => (
        <div
          key={index}
          className="grid grid-cols-2 items-start gap-x-2 border-t border-border px-2 py-1.5"
        >
          <code className="break-all font-mono text-xs">{output.key}</code>
          <code
            className={cn(
              'break-all rounded px-1 py-0.5 font-mono text-xs',
              output.currentValue != null
                ? 'bg-slate-100 dark:bg-slate-700'
                : 'italic bg-muted/30 dark:bg-slate-600',
            )}
            title={
              typeof output.currentValue === 'string'
                ? output.currentValue
                : undefined
            }
          >
            {formatValue(output.currentValue) || '<will be generated>'}
          </code>
        </div>
      ))}
    </div>
  );
}
