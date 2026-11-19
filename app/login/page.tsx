import type { Metadata } from 'next';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Вход' };

export default function LoginPage() {
   return (
      <main className="min-h-svh flex items-center justify-center bg-background px-4">
         <div className="w-full max-w-sm flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
               <div className="size-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-lg">
                  🍲
               </div>
               <h1 className="text-xl font-semibold">Рецепты</h1>
               <p className="text-sm text-muted-foreground">Войдите тем же логином, что в Mealie</p>
            </div>
            <LoginForm />
         </div>
      </main>
   );
}
