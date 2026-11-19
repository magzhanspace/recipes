'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login, type LoginState } from '@/lib/session';

export function LoginForm() {
   const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
   return (
      <form action={action} className="flex flex-col gap-4 rounded-lg border bg-container p-6">
         <div className="flex flex-col gap-2">
            <Label htmlFor="username">Логин или email</Label>
            <Input
               id="username"
               name="username"
               autoComplete="username"
               autoCapitalize="none"
               defaultValue={state.username}
               required
            />
         </div>
         <div className="flex flex-col gap-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
               id="password"
               name="password"
               type="password"
               autoComplete="current-password"
               required
            />
         </div>
         {state.error && <p className="text-sm text-destructive">{state.error}</p>}
         <Button type="submit" disabled={pending}>
            {pending ? 'Входим…' : 'Войти'}
         </Button>
      </form>
   );
}
