import { OUTPUT_KEYS } from "@/lib/types";
import { googleApi } from "@/lib/api/google/index";
import { portalUrls } from "@/lib/api/url-builder";
import { createStepCheck } from "../../utils/check-factory";
import { handleCheckError } from "../../utils/error-handling";
import { APIError } from "@/lib/api/utils";

export const checkAutomationOu = createStepCheck({
  requiredOutputs: [],
  checkLogic: async (context) => {
    try {
      const orgUnit = await googleApi.orgUnits.get(
        "/Automation",
        undefined,
        context.logger,
      );
      if (orgUnit?.orgUnitId && orgUnit.orgUnitPath) {
        return {
          completed: true,
          message: `Organizational Unit '/Automation' found.`,
          outputs: {
            [OUTPUT_KEYS.AUTOMATION_OU_ID]: orgUnit.orgUnitId,
            [OUTPUT_KEYS.AUTOMATION_OU_PATH]: orgUnit.orgUnitPath,
            resourceUrl: portalUrls.google.orgUnits.details(
              orgUnit.orgUnitPath,
            ),
          },
        };
      }
      return {
        completed: false,
        message: `Organizational Unit '/Automation' not found.`,
      };
    } catch (e) {
      if (e instanceof APIError && e.status === 404) {
        return {
          completed: false,
          message: `Organizational Unit '/Automation' not found.`,
        };
      }
      return handleCheckError(e, "Couldn't verify for OU '/Automation'.");
    }
  },
});
