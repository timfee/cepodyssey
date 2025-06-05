import type * as MicrosoftGraph from "microsoft-graph";

export type ServicePrincipal = MicrosoftGraph.ServicePrincipal;
export type Application = MicrosoftGraph.Application;
export type SynchronizationJob = MicrosoftGraph.SynchronizationJob;
export type AppRoleAssignment = MicrosoftGraph.AppRoleAssignment;
export type SynchronizationSchema = MicrosoftGraph.SynchronizationSchema;
export type SynchronizationRule = MicrosoftGraph.SynchronizationRule;

export interface SamlMetadata {
  entityId: string;
  ssoUrl: string;
  certificate: string;
}
