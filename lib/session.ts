'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { MEALIE_URL, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/mealie/client';

export type LoginState = { error?: string; username?: string };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
   const username = String(form.get('username') ?? '').trim();
   const password = String(form.get('password') ?? '');
   if (!username || !password) return { error: 'Введите логин и пароль', username };

   let token: string | undefined;
   try {
      const res = await fetch(`${MEALIE_URL}/api/auth/token`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
         body: new URLSearchParams({ username, password, remember_me: 'true' }),
         cache: 'no-store',
      });
      if (res.status === 401 || res.status === 403) {
         return { error: 'Неверный логин или пароль', username };
      }
      if (res.status === 423) return { error: 'Аккаунт временно заблокирован', username };
      if (!res.ok) return { error: `Mealie ответил ${res.status}`, username };
      token = ((await res.json()) as { access_token?: string }).access_token;
   } catch {
      return { error: 'Mealie недоступен', username };
   }
   if (!token) return { error: 'Mealie не вернул токен', username };

   (await cookies()).set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
   });
   redirect('/recipes');
}
