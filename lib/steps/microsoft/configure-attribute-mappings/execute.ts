import { microsoftApi } from "@/lib/api/microsoft";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import type * as MicrosoftGraph from "microsoft-graph";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { withExecutionHandling } from "../../utils/execute-wrapper";
import { getRequiredOutput } from "../../utils/get-output";
import { getTokens } from "../../utils/auth";

export const executeConfigureAttributeMappings = withExecutionHandling({
  stepId: STEP_IDS.CONFIGURE_ATTRIBUTE_MAPPINGS,
  requiredOutputs: [
    OUTPUT_KEYS.PROVISIONING_APP_ID,
    OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
    OUTPUT_KEYS.PROVISIONING_JOB_ID,
  ],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {
    const { microsoftToken } = await getTokens();
    const spId = getRequiredOutput<string>(
      context,
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
    );
    const appId = getRequiredOutput<string>(context, OUTPUT_KEYS.PROVISIONING_APP_ID);
    const jobId = getRequiredOutput<string>(context, OUTPUT_KEYS.PROVISIONING_JOB_ID);
    
    const schema: MicrosoftGraph.SynchronizationTemplate = {
      id: "GoogleApps",
    };

    await microsoftApi.provisioning.configureMappings(
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
