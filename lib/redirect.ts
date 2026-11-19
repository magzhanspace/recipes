import { NextResponse, type NextRequest } from 'next/server';

/**
 * Redirect to a path on the host the browser actually used. Behind Caddy the
 * standalone server sees its own listen address (127.0.0.1:3120) in
 * `request.url`, so URLs built from it would send people to localhost.
 * Caddy only routes recipes.magzhan.me here, so the Host header is trusted.
 */
export function localRedirect(request: NextRequest, path: `/${string}`, status: 303 | 307 = 307) {
   const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
   const proto =
      request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '');
   const url = host ? new URL(path, `${proto}://${host}`) : new URL(path, request.url);
   return NextResponse.redirect(url, status);
}
