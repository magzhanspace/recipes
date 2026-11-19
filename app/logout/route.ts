import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/mealie/client';

/** Clears the session. Also where unwrap() sends a request whose token expired. */
export async function GET(request: NextRequest) {
   const res = NextResponse.redirect(new URL('/login', request.url));
   res.cookies.delete(SESSION_COOKIE);
   return res;
}

export const POST = GET;
