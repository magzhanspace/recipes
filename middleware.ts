import { NextResponse, type NextRequest } from 'next/server';
import { localRedirect } from '@/lib/redirect';

// Kept in sync with SESSION_COOKIE in lib/mealie/client.ts (middleware can't import server-only).
const SESSION_COOKIE = 'recipes_session';

/**
 * Convenience redirect only. Every page, action and media route checks the
 * session itself, because Mealie validates the token on each request.
 */
export function middleware(request: NextRequest) {
   const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
   const { pathname } = request.nextUrl;
   if (pathname === '/login') {
      return hasSession ? localRedirect('/recipes') : NextResponse.next();
   }
   if (!hasSession) {
      if (pathname.startsWith('/media/')) return new NextResponse(null, { status: 401 });
      return localRedirect('/login');
   }
   return NextResponse.next();
}

export const config = {
   matcher: ['/((?!_next/|logout|favicon.ico|robots.txt|.*\\.(?:png|svg|ico|webmanifest)$).*)'],
};
