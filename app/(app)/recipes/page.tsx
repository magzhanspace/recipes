import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, ImageOff } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { mealie, unwrap } from '@/lib/mealie/client';
import { recipeImage } from '@/lib/images';
import { ImportRecipe } from './import-recipe';
import { RecipeSearch } from './recipe-search';

export const metadata: Metadata = { title: 'Рецепты' };

export default async function RecipesPage({
   searchParams,
}: {
   searchParams: Promise<{ q?: string }>;
}) {
   const { q = '' } = await searchParams;
   const api = await mealie();
   const data = unwrap(
      await api.GET('/api/recipes', {
         params: {
            query: {
               search: q || undefined,
               perPage: 200,
               orderBy: q ? undefined : 'created_at',
               orderDirection: 'desc',
            },
         },
      }),
      'recipes'
   );

   return (
      <>
         <PageHeader title="Рецепты" count={data.total ?? data.items.length}>
            <ImportRecipe />
         </PageHeader>
         <div className="border-b px-4 sm:px-6 py-2 shrink-0">
            <RecipeSearch initial={q} />
         </div>
         <div className="overflow-auto flex-1">
            {data.items.length === 0 ? (
               <div className="flex flex-col items-center justify-center gap-2 py-24 px-6 text-center">
                  <p className="text-sm font-medium">
                     {q ? 'Ничего не нашлось' : 'Пока нет рецептов'}
                  </p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                     {q
                        ? 'Попробуйте другое слово.'
                        : 'Нажмите «Добавить» и вставьте ссылку на рецепт с любого сайта.'}
                  </p>
               </div>
            ) : (
               <ul>
                  {data.items.map((r) => {
                     const img = recipeImage(r, 'tiny-original.webp');
                     return (
                        <li key={r.id}>
                           <Link
                              href={`/recipes/${r.slug}`}
                              className="w-full flex items-center gap-3 h-14 px-4 sm:px-6 hover:bg-sidebar/50 border-b border-border/50"
                           >
                              {img ? (
                                 // eslint-disable-next-line @next/next/no-img-element
                                 <img
                                    src={img}
                                    alt=""
                                    className="size-9 rounded-md object-cover shrink-0 bg-muted"
                                    loading="lazy"
                                 />
                              ) : (
                                 <div className="size-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                                    <ImageOff className="size-4 text-muted-foreground" />
                                 </div>
                              )}
                              <span className="text-sm font-medium truncate min-w-0">{r.name}</span>
                              <span className="ml-auto flex items-center gap-2 shrink-0">
                                 {(r.tags ?? []).slice(0, 2).map((t) => (
                                    <span
                                       key={t.id}
                                       className="hidden sm:inline-block text-xs text-muted-foreground border border-border rounded-md px-1.5 py-0.5"
                                    >
                                       {t.name}
                                    </span>
                                 ))}
                                 {r.totalTime && (
                                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                                       <Clock className="size-3" />
                                       {r.totalTime}
                                    </span>
                                 )}
                              </span>
                           </Link>
                        </li>
                     );
                  })}
               </ul>
            )}
         </div>
      </>
   );
}
