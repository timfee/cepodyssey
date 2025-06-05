"use client";
import type { Session } from "next-auth";
import React from "react";
import { SessionGuard } from "./session-guard";
import { ActionToolbar } from "./action-toolbar";
import { ProgressSummary } from "./progress-summary";
import { AutomationExecutor } from "./automation-executor";
import { useStepRunner } from "./hooks/use-step-runner";
import { useProgressPersistence } from "./hooks/use-progress-persistence";
import { useAutoChecker } from "./hooks/use-auto-checker";

export function AutomationDashboard({ serverSession }: { serverSession: Session }) {
  const {
    canRunAutomation,
    handleExecute,
    executeCheck,
    manualRefresh,
    isChecking,
    runAllPending,
  } = useStepRunner();

  useProgressPersistence();
  useAutoChecker(executeCheck);

  return (
    <SessionGuard serverSession={serverSession}>
      {(currentSession, isLoading) => (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          <main className="container mx-auto max-w-5xl space-y-8 p-4 py-8 md:p-8">
            <header className="border-b pb-6">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Google + Microsoft Integration
              </h1>
              <p className="mt-1 text-muted-foreground">Connect your directories in minutes</p>
            </header>
            <ActionToolbar session={currentSession} isLoadingSession={isLoading} />
            <ProgressSummary
              onRunAll={runAllPending}
              onRefresh={manualRefresh}
              isRefreshing={isChecking}
              canRunAutomation={canRunAutomation}
            />
            <AutomationExecutor onExecuteStep={handleExecute} />
          </main>
        </div>
      )}
    </SessionGuard>
  );
}
