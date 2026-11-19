'use client';

import { Search } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

export function RecipeSearch({ initial }: { initial: string }) {
   const router = useRouter();
   const pathname = usePathname();
   const [value, setValue] = useState(initial);
   const [, startTransition] = useTransition();

   useEffect(() => {
      if (value === initial) return;
      const t = setTimeout(() => {
         const q = value.trim();
         startTransition(() =>
            router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname)
         );
      }, 250);
      return () => clearTimeout(t);
   }, [value, initial, pathname, router]);

   return (
      <label className="flex items-center gap-2 h-8">
         <Search className="size-4 text-muted-foreground shrink-0" />
         <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Поиск по названию и ингредиентам"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            type="search"
         />
      </label>
   );
}
