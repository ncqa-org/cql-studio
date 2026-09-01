// Author: Preston Lee

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { EndpointConfiguration } from '../models/environment.model';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

@Injectable({ providedIn: 'root' })
export class SmartAuthService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, CachedToken>();
  /** Deduplicates concurrent token requests: all callers share the same in-flight Promise. */
  private readonly inflight = new Map<string, Promise<string>>();

  getAccessToken(config: EndpointConfiguration): Promise<string> {
    const smartConfig = config.smartAuth;
    if (!smartConfig?.tokenUrl || !smartConfig.clientId) {
      return Promise.reject(new Error('Incomplete SMART auth configuration: tokenUrl and clientId are required'));
    }

    const cacheKey = `${smartConfig.tokenUrl}::${smartConfig.clientId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt - Date.now() > 60_000) {
      return Promise.resolve(cached.token);
    }

    // Return the in-flight request if one is already pending for this key,
    // so concurrent FHIR requests don't each independently call the token endpoint.
    const pending = this.inflight.get(cacheKey);
    if (pending) {
      return pending;
    }

    const promise = this.fetchToken(smartConfig, cacheKey).finally(() => {
      this.inflight.delete(cacheKey);
    });
    this.inflight.set(cacheKey, promise);
    return promise;
  }

  clearCache(tokenUrl?: string, clientId?: string): void {
    if (tokenUrl && clientId) {
      const key = `${tokenUrl}::${clientId}`;
      this.cache.delete(key);
      this.inflight.delete(key);
    } else {
      this.cache.clear();
      this.inflight.clear();
    }
  }

  private async fetchToken(
    smartConfig: { tokenUrl: string; clientId: string; clientSecret?: string; scopes?: string },
    cacheKey: string
  ): Promise<string> {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: smartConfig.clientId
    });
    if (smartConfig.clientSecret) {
      body.set('client_secret', smartConfig.clientSecret);
    }
    if (smartConfig.scopes) {
      body.set('scope', smartConfig.scopes);
    }

    const response = await firstValueFrom(
      this.http.post<TokenResponse>(smartConfig.tokenUrl, body.toString(), {
        headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
      })
    );

    const expiresAt = Date.now() + (response.expires_in ?? 3600) * 1000;
    this.cache.set(cacheKey, { token: response.access_token, expiresAt });
    return response.access_token;
  }
}
