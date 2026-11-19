import 'server-only';

import createClient from 'openapi-fetch';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { paths } from './schema';

/**
 * Mealie is only reachable from this server (127.0.0.1 on hermes, or an SSH
 * tunnel in development). The browser never talks to it directly and never
 * sees the token: it lives in an httpOnly cookie and is attached here.
 */
export const MEALIE_URL = process.env.MEALIE_URL ?? 'http://127.0.0.1:9925';
export const SESSION_COOKIE = 'recipes_session';
/** Matches TOKEN_TIME on the Mealie side (90 days). */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 90;

export type Mealie = ReturnType<typeof mealieFor>;

export function mealieFor(token: string) {
   return createClient<paths>({
      baseUrl: MEALIE_URL,
      headers: { 'Authorization': `Bearer ${token}`, 'Accept-Language': 'ru-RU' },
      fetch: (request: Request) => fetch(request, { cache: 'no-store' }),
   });
}

export async function getSessionToken(): Promise<string | null> {
   return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

/**
 * Client for the signed-in user. Redirects to /login without a session.
 * Call it outside try/catch: redirect() works by throwing.
 */
export async function mealie(): Promise<Mealie> {
   const token = await getSessionToken();
   if (!token) redirect('/login');
   return mealieFor(token);
}

/**
 * Unwraps an openapi-fetch result. An expired or revoked token sends the user
 * through /logout (a route handler, the only place the cookie can be cleared).
 * Call it outside try/catch for the same reason as mealie().
 */
export function unwrap<T>(
   res: { data?: T; error?: unknown; response: Response },
   what = 'Mealie'
): T {
   if (res.response.status === 401) redirect('/logout');
   if (res.error !== undefined || res.data === undefined) {
      throw new Error(`${what}: HTTP ${res.response.status}`);
   }
   return res.data;
}

/** Same as unwrap, for server actions that report errors instead of throwing. */
export function check(res: { error?: unknown; response: Response }): string | null {
   if (res.response.status === 401) redirect('/logout');
   if (res.response.ok) return null;
   const detail =
      typeof res.error === 'object' && res.error && 'detail' in res.error
         ? JSON.stringify((res.error as { detail: unknown }).detail)
         : '';
   return `Mealie ответил ${res.response.status}${detail ? `: ${detail}` : ''}`;
}
