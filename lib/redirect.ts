import { NextResponse } from 'next/server';

/**
 * Redirect with a relative Location header. Behind Caddy the standalone
 * server sees its own listen address (127.0.0.1:3120) in `request.url`, so
 * absolute URLs built from it would send people to localhost.
 */
export function localRedirect(path: `/${string}`, status: 303 | 307 = 307) {
   return new NextResponse(null, { status, headers: { Location: path } });
}
