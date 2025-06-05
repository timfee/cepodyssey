"use server";

import * as microsoft from "@/lib/api/microsoft";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import type * as MicrosoftGraph from "microsoft-graph";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { getTokens } from "../utils/auth";
import { handleExecutionError } from "../../utils/error-handling";
import { STEP_IDS } from "@/lib/steps/step-refs";

/**
 * Configure default attribute mappings for the provisioning connection.
 */
export async function executeConfigureAttributeMappings(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { microsoftToken } = await getTokens();
    const required = [
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
      OUTPUT_KEYS.PROVISIONING_JOB_ID,
      OUTPUT_KEYS.PROVISIONING_APP_ID,
    ];
    const missing = required.filter((k) => !context.outputs[k]);
    if (missing.length > 0) {
      return {
        success: false,
        error: {
          message: `Missing required outputs: ${missing.join(", ")}. Ensure M-3 (Authorize Provisioning Connection) completed successfully.`,
          code: "MISSING_DEPENDENCY",
        },
      };
    }
    const spObjectId = context.outputs[
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID
    ] as string;
    const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as string;
    const appId = context.outputs[OUTPUT_KEYS.PROVISIONING_APP_ID] as string;

    const attributeMappingSourceTypeAttribute =
      "Attribute" as MicrosoftGraph.AttributeMappingSourceType;

    const schemaPayload: {
      synchronizationRules: MicrosoftGraph.SynchronizationRule[];
    } = {
      synchronizationRules: [
        {
          name: "UserProvisioningToGoogleWorkspace",
          sourceDirectoryName: "Azure Active Directory",
          targetDirectoryName: "Google Workspace",
          objectMappings: [
            {
              enabled: true,
              sourceObjectName: "user",
              targetObjectName: "User",
              attributeMappings: [
                {
                  targetAttributeName: "userName",
                  source: {
                    expression: "[userPrincipalName]",
                    name: "userPrincipalName",
                    type: attributeMappingSourceTypeAttribute,
                  },
                  matchingPriority: 1,
                },
                {
                  targetAttributeName: "active",
                  source: {
                    expression: "[accountEnabled]",
                    name: "accountEnabled",
                    type: attributeMappingSourceTypeAttribute,
                  },
                },
                {
                  targetAttributeName: "displayName",
                  source: {
                    expression: "[displayName]",
                    name: "displayName",
                    type: attributeMappingSourceTypeAttribute,
                  },
                },
                {
                  targetAttributeName: "name.givenName",
                  source: {
                    expression: "[givenName]",
                    name: "givenName",
                    type: attributeMappingSourceTypeAttribute,
                  },
                },
                {
                  targetAttributeName: "name.familyName",
                  source: {
                    expression: "[surname]",
                    name: "surname",
                    type: attributeMappingSourceTypeAttribute,
                  },
                },
                {
                  targetAttributeName: 'emails[type eq "work"].value',
                  source: {
                    expression: "[mail]",
                    name: "mail",
                    type: attributeMappingSourceTypeAttribute,
                  },
                },
                {
                  targetAttributeName: "externalId",
                  source: {
                    expression: "[objectId]",
                    name: "objectId",
                    type: attributeMappingSourceTypeAttribute,
                  },
                  matchingPriority: 2,
                },
              ],
            },
          ],
        },
      ],
    };

    await microsoft.configureAttributeMappings(
      microsoftToken,
      spObjectId,
      jobId,
      schemaPayload,
    );

    return {
      success: true,
      message:
        "Default attribute mappings configured. Review in Azure Portal; customize if specific needs exist.",
      outputs: { [OUTPUT_KEYS.FLAG_M4_PROV_MAPPINGS_CONFIGURED]: true },
      resourceUrl: portalUrls.azure.enterpriseApp.provisioning(
        spObjectId,
        appId,
      ),
    };
  } catch (e) {
    return handleExecutionError(e, STEP_IDS.CONFIGURE_ATTRIBUTE_MAPPINGS);
  }
}
