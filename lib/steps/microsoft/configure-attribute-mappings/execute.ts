import * as microsoft from "@/lib/api/microsoft";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import type * as MicrosoftGraph from "microsoft-graph";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { getTokens } from "../../utils/auth";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { withExecutionHandling } from "../../utils/execute-wrapper";

export const executeConfigureAttributeMappings = withExecutionHandling({
  stepId: STEP_IDS.CONFIGURE_ATTRIBUTE_MAPPINGS,
  requiredOutputs: [
    OUTPUT_KEYS.PROVISIONING_APP_ID,
    OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
    OUTPUT_KEYS.PROVISIONING_JOB_ID,
  ],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {
    const { microsoftToken } = await getTokens();
    const spId = context.outputs[
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID
    ] as string;
    const appId = context.outputs[OUTPUT_KEYS.PROVISIONING_APP_ID] as string;
    const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as string;

    const schema: MicrosoftGraph.SynchronizationTemplate = {
      id: "GoogleApps",
    };

    await microsoft.configureAttributeMappings(
      microsoftToken,
      spId,
      jobId,
      schema,
      context.logger,
    );

    return {
      success: true,
      message: "Attribute mappings configured.",
      outputs: { [OUTPUT_KEYS.FLAG_M4_PROV_MAPPINGS_CONFIGURED]: true },
      resourceUrl: portalUrls.azure.enterpriseApp.provisioning(spId, appId),
    };
  },
});
