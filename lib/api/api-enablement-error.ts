import { APIError } from "./utils";

export interface APIEnablementInfo {
  apiName: string;
  enableUrl: string;
  docUrl?: string;
}

const API_ENABLEMENT_PATTERNS = [
  {
    pattern:
      /Cloud Identity API has not been used in project (\d+) before or it is disabled/,
    apiName: "Google Cloud Identity API",
    apiUrlTemplate:
      "https://console.developers.google.com/apis/api/cloudidentity.googleapis.com/overview?project={projectId}",
    docUrl: "https://cloud.google.com/identity/docs/setup",
  },
  {
    pattern:
      /Admin SDK API has not been used in project (\d+) before or it is disabled/,
    apiName: "Google Admin SDK API",
    apiUrlTemplate:
      "https://console.developers.google.com/apis/api/admin.googleapis.com/overview?project={projectId}",
    docUrl:
      "https://developers.google.com/admin-sdk/directory/v1/get-start/getting-started",
  },
];

export function isAPIEnablementError(error: unknown): boolean {
  if (!(error instanceof APIError)) return false;
  const message = error.message || "";
  return API_ENABLEMENT_PATTERNS.some((p) => p.pattern.test(message));
}

export function getAPIEnablementInfo(
  error: APIError,
): APIEnablementInfo | null {
  const message = error.message || "";

  for (const config of API_ENABLEMENT_PATTERNS) {
    const match = message.match(config.pattern);
    if (match) {
      const projectId = match[1];
      return {
        apiName: config.apiName,
        enableUrl: config.apiUrlTemplate.replace("{projectId}", projectId),
        docUrl: config.docUrl,
      };
    }
  }

  return null;
}

export function createEnablementError(originalError: APIError): APIError {
  const info = getAPIEnablementInfo(originalError);
  if (!info) return originalError;

  const enhancedMessage =
    `${info.apiName} is not enabled for your Google Cloud project.\n\n` +
    `To fix this:\n` +
    `1. Click here to enable the API: ${info.enableUrl}\n` +
    `2. Wait 2-3 minutes for the change to propagate\n` +
    `3. Try this step again\n\n` +
    `Original error: ${originalError.message}`;

  return new APIError(enhancedMessage, originalError.status, "API_NOT_ENABLED");
}
