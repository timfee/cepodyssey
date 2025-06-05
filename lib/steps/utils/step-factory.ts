import { stepContentEnhancements, StepContent } from "../step-content-updates";
import type {
  StepDefinition,
  StepInput,
  StepOutput,
  StepContext,
  StepCheckResult,
  StepExecutionResult,
} from "@/lib/types";
import type { StepId } from "../step-refs";

export type CheckFn = (context: StepContext) => Promise<StepCheckResult>;
export type ExecuteFn = (context: StepContext) => Promise<StepExecutionResult>;

export type StepUrls = StepDefinition["adminUrls"];

export interface StepMetadata {
  title: string;
  description: string;
  category: StepDefinition["category"];
  activity: StepDefinition["activity"];
  provider?: StepDefinition["provider"];
  automatability?: StepDefinition["automatability"];
  requires?: StepId[];
}

function inferProvider(id: StepId): StepDefinition["provider"] {
  return id.startsWith("G-") ? "Google" : "Microsoft";
}

export function defineStep<TInputs extends StepInput[], TOutputs extends StepOutput[]>(
  config: {
    id: StepId;
    metadata: StepMetadata;
    io: { inputs: TInputs; outputs: TOutputs };
    handlers: { check: CheckFn; execute: ExecuteFn };
    urls?: StepUrls;
  },
): StepDefinition {
  const enhancement: StepContent = stepContentEnhancements[config.id] || { details: "", actions: [] };
  const provider = config.metadata.provider ?? inferProvider(config.id);
  const automatability = config.metadata.automatability ?? "automated";

  return {
    id: config.id,
    title: config.metadata.title,
    description: config.metadata.description,
    details: enhancement.details,
    category: config.metadata.category,
    activity: config.metadata.activity,
    provider,
    automatability,
    automatable: automatability !== "manual",
    requires: config.metadata.requires,
    inputs: config.io.inputs,
    outputs: config.io.outputs,
    nextStep: enhancement.nextStep,
    actions: enhancement.actions,
    adminUrls: config.urls,
    check: config.handlers.check,
    execute: config.handlers.execute,
  };
}
