// Author: Preston Lee

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { EnvironmentService } from '../services/environment.service';
import { SmartAuthService } from '../services/smart-auth.service';
import { EndpointConfiguration } from '../models/environment.model';
import { normalizeEndpointAddress } from '../services/endpoint-config.lib';

export const smartFhirAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const environmentService = inject(EnvironmentService);
  const smartAuth = inject(SmartAuthService);

  const activeId = environmentService.activeEnvironmentId();
  const activeEnv = environmentService.environments().find(e => e.id === activeId);
  if (!activeEnv) {
    return next(req);
  }

  const endpoints: EndpointConfiguration[] = [
    activeEnv.evaluationServer,
    activeEnv.dataEndpoint,
    activeEnv.terminologyEndpoint,
    activeEnv.contentEndpoint
  ];

  const matchingEndpoint = endpoints.find(ep => {
    if (ep?.authType !== 'smart-client-credentials') return false;
    const address = normalizeEndpointAddress(ep.address);
    return !!address && req.url.startsWith(address);
  });

  if (!matchingEndpoint) {
    return next(req);
  }

  return from(smartAuth.getAccessToken(matchingEndpoint)).pipe(
    switchMap(token => next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })))
  );
};
