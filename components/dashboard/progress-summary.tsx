"use client";
import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Loader2Icon, PlayIcon } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/hooks/use-redux";
import { clearAllCheckTimestamps } from "@/lib/redux/slices/app-state";
import { StepStatus } from "@/lib/constants/enums";

interface ProgressSummaryProps {
  onRunAll: () => Promise<void>;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  canRunAutomation: boolean;
}

export function ProgressSummary({ onRunAll, onRefresh, isRefreshing, canRunAutomation }: ProgressSummaryProps) {
  const dispatch = useAppDispatch();
  const stepsStatusMap = useAppSelector((state) => state.app.steps);

  const [totalSteps, setTotalSteps] = React.useState(0);
  React.useEffect(() => {
    void (async () => {
      const { allStepDefinitions } = await import("@/lib/steps");
      setTotalSteps(allStepDefinitions.length);
    })();
  }, []);
  const completedSteps = Object.values(stepsStatusMap).filter(
    (s) => s.status === StepStatus.COMPLETED,
  ).length;
  const progressPercent = (completedSteps / totalSteps) * 100;

  const refreshChecks = useCallback(async () => {
    if (!canRunAutomation) return;
    dispatch(clearAllCheckTimestamps());
    await onRefresh();
  }, [dispatch, onRefresh, canRunAutomation]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Progress</CardTitle>
            <CardDescription>
              {completedSteps}/{totalSteps} done
            </CardDescription>
          </div>
          {canRunAutomation && (
            <Button
              variant="outline"
              size="sm"
              onClick={refreshChecks}
              title="Refresh status from server"
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progressPercent} className="h-3" />
        {canRunAutomation && completedSteps < totalSteps && (
          <Button onClick={onRunAll} className="w-full" size="lg">
            <PlayIcon className="mr-2 h-5 w-5" />
            Run all ({totalSteps - completedSteps} remaining)
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
