import Link from 'next/link';

export default function NotFound() {
   return (
      <main className="min-h-svh flex flex-col items-center justify-center gap-3 px-4 text-center bg-background">
         <p className="text-sm font-medium">Такой страницы нет</p>
         <p className="text-sm text-muted-foreground">
            Возможно, рецепт удалили или ссылка устарела.
         </p>
         <Link href="/recipes" className="text-sm underline">
            К рецептам
         </Link>
      </main>
   );
}
