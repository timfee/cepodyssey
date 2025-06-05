import { OUTPUT_KEYS } from "@/lib/types";
import { createStepCheck } from "../../utils/check-factory";
import { googleApi } from "@/lib/api/google";
import { handleCheckError } from "../../utils/error-handling";
import { getRequiredOutput } from "../../utils/get-output";

export const checkSuperAdmin = createStepCheck({
  requiredOutputs: [OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL],
  checkLogic: async (context) => {
    const email = getRequiredOutput<string>(
      context,
      OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL,
    );
    try {
      const user = await googleApi.users.get(email, context.logger);

      if (!user) {
        return {
          completed: false,
          message: `Service account '${email}' not found.`,
        };
      }
      if (user.isAdmin === true && user.suspended === false) {
        return {
          completed: true,
          message: `Service account '${email}' has admin privileges.`,
          outputs: { [OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID]: "3" },
        };
      }
      const roles = await googleApi.roles.listAssignments(
        email,
        undefined,
        context.logger,
      );
      const hasSuperAdmin = roles.some((r) => r.roleId === "3");
      return hasSuperAdmin
        ? {
            completed: true,
            message: `Service account has Super Admin role assigned.`,
            outputs: { [OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID]: "3" },
          }
        : {
            completed: false,
            message: `Service account exists but lacks admin privileges.`,
          };
    } catch (e) {
      return handleCheckError(e, `Couldn't verify admin status.`);
    }
  },
});
