import { SESSION_COOKIE } from '@/lib/mealie/client';
import { localRedirect } from '@/lib/redirect';

/** Clears the session. Also where unwrap() sends a request whose token expired. */
export async function GET() {
   // 303 so the logout form's POST lands on a GET of /login.
   const res = localRedirect('/login', 303);
   res.cookies.delete(SESSION_COOKIE);
   return res;
}

export const POST = GET;
