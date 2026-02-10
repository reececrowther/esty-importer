/**
 * Etsy OAuth 2.0 helpers (PKCE, state, cookie names).
 * Used by /api/etsy/auth and /api/etsy/callback.
 */

import { createHash, randomBytes } from 'crypto';

export const ETSY_COOKIE_PREFIX = 'etsy_';
export const ETSY_COOKIE_VERIFIER = `${ETSY_COOKIE_PREFIX}oauth_verifier`;
export const ETSY_COOKIE_STATE = `${ETSY_COOKIE_PREFIX}oauth_state`;
export const ETSY_COOKIE_TOKENS = `${ETSY_COOKIE_PREFIX}tokens`;
export const ETSY_COOKIE_RETURN_TO = `${ETSY_COOKIE_PREFIX}return_to`;

/** PKCE: generate code_verifier (43–128 chars, unreserved URI) */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString('base64url');
}

/** PKCE: code_challenge = BASE64URL(SHA256(code_verifier)) */
export function generateCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

/** Single-use state for CSRF protection */
export function generateState(): string {
  return randomBytes(24).toString('base64url');
}

export interface EtsyTokenPayload {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  shopId?: number;
}

/** Parse token cookie (no encryption in MVP; use HTTPS in production) */
export function parseTokenCookie(value: string | undefined): EtsyTokenPayload | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as EtsyTokenPayload;
    if (parsed.accessToken && parsed.refreshToken && typeof parsed.expiresAt === 'number') {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

const ETSY_TOKEN_URL = 'https://api.etsy.com/v3/public/oauth/token';

/** Refresh Etsy access token; returns new payload or null. */
export async function refreshEtsyTokens(
  refreshToken: string,
  clientId: string
): Promise<EtsyTokenPayload | null> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: refreshToken,
  });
  const res = await fetch(ETSY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
}
