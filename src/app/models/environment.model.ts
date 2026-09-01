// Author: Preston Lee

export type EndpointAuthType = 'none' | 'basic' | 'smart-client-credentials';

export interface SmartClientCredentialsConfig {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scopes?: string;
}

/** Subset of FHIR R4 Endpoint used by CQL Studio + HAPI $evaluate */
export interface EndpointConfiguration {
  address: string;
  authType?: EndpointAuthType;
  /** Convenience fields compiled into Endpoint.header as Authorization: Basic when authType is 'basic' */
  basicAuthUsername?: string;
  basicAuthPassword?: string;
  /** OAuth2 client credentials config used when authType is 'smart-client-credentials' */
  smartAuth?: SmartClientCredentialsConfig;
  /** Additional FHIR Endpoint.header entries ("Name: value") */
  headers?: string[];
}

export interface CqlEnvironment {
  id: string;
  name: string;
  builtIn?: boolean;
  evaluationServer: EndpointConfiguration;
  dataEndpoint: EndpointConfiguration;
  terminologyEndpoint: EndpointConfiguration;
  contentEndpoint: EndpointConfiguration;
}

export const BUILT_IN_ENVIRONMENT_ID = 'default';

export type EndpointRole = 'evaluation' | 'data' | 'terminology' | 'content';

export interface EndpointHttpContext {
  address: string;
  headers: Record<string, string>;
}

export function workspaceEnvironmentSyntheticId(workspaceId: string, environmentId: string): string {
  return `ws:${workspaceId}:${environmentId}`;
}
