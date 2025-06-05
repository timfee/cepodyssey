import type {
  StepDefinition,
  StepInput,
  StepOutput,
  StepContext,
  StepCheckResult,
  StepExecutionResult,
} from "@/lib/types";
import type { StepId } from "../step-refs";

export interface StepMetadata {
  title: string;
  description: string;
  details: string;
  category: StepDefinition["category"];
  activity: StepDefinition["activity"];
  provider?: StepDefinition["provider"];
  automatability?: StepDefinition["automatability"];
}

export type CheckFn = (context: StepContext) => Promise<StepCheckResult>;
export type ExecuteFn = (context: StepContext) => Promise<StepExecutionResult>;

export type StepUrls = StepDefinition["adminUrls"];

interface StepFactoryConfig {
  id: StepId;
  metadata: StepMetadata;
  io: { inputs: StepInput[]; outputs: Array<StepOutput | string> };
  requires?: StepId[];
  nextStep?: StepDefinition["nextStep"];
  actions?: string[];
  handlers: { check?: CheckFn; execute?: ExecuteFn };
  urls?: StepUrls;
}

export function defineStep({
  id,
  metadata,
  io,
  requires,
  nextStep,
  actions,
  handlers,
  urls,
}: StepFactoryConfig): StepDefinition {
  const provider =
    metadata.provider || (metadata.category === "Microsoft" ? "Microsoft" : "Google");

  const outputs: StepOutput[] = (io.outputs || []).map((o) =>
    typeof o === "string" ? { key: o } : o,
  );

  return {
    id,
    title: metadata.title,
    description: metadata.description,
    details: metadata.details,
    category: metadata.category,
    activity: metadata.activity,
    provider,
    automatability: metadata.automatability ?? "automated",
    automatable: true,
    inputs: io.inputs,
    outputs,
    requires,
    nextStep,
    actions,
    adminUrls: urls,
    check: handlers.check,
    execute: handlers.execute,
  };
}
