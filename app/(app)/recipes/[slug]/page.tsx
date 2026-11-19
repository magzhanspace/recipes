import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Clock, ExternalLink, TriangleAlert, Users } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { mealie, unwrap } from '@/lib/mealie/client';
import { recipeImage } from '@/lib/images';
import { halalIssues } from '@/lib/halal';
import { isoDate } from '@/lib/dates';
import { RecipeActions } from './recipe-actions';

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
   const api = await mealie();
   const res = await api.GET('/api/recipes/{slug}', { params: { path: { slug } } });
   if (res.response.status === 404) notFound();
   return unwrap(res, 'recipe');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
   const recipe = await load((await params).slug);
   return { title: recipe.name ?? 'Рецепт' };
}

export default async function RecipePage({ params }: Props) {
   const recipe = await load((await params).slug);
   const img = recipeImage(recipe, 'original.webp');
   const issues = halalIssues(recipe);
   const servings = recipe.recipeServings || recipe.recipeYieldQuantity || null;
   const times = [
      recipe.prepTime && `подготовка ${recipe.prepTime}`,
      recipe.performTime && `готовка ${recipe.performTime}`,
      recipe.totalTime && `всего ${recipe.totalTime}`,
   ].filter(Boolean);

   return (
      <>
         <PageHeader
            title={
               <Link href="/recipes" className="inline-flex items-center gap-1 hover:underline">
                  <ChevronLeft className="size-4" />
                  Рецепты
               </Link>
            }
         >
            <RecipeActions recipeId={recipe.id!} today={isoDate()} />
         </PageHeader>
         <div className="overflow-auto flex-1">
            <article className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
               {issues.length > 0 && (
                  <div className="flex items-start gap-2 rounded-md border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm">
                     <TriangleAlert className="size-4 text-orange-500 shrink-0 mt-0.5" />
                     <span>
                        Похоже, в рецепте есть {issues.join(' и ')}. Замените ингредиент на
                        халяльный или удалите рецепт в Mealie.
                     </span>
                  </div>
               )}
               <header className="flex flex-col gap-3">
                  <h1 className="text-2xl font-semibold leading-tight">{recipe.name}</h1>
                  {recipe.description && (
                     <p className="text-sm text-muted-foreground">{recipe.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                     {times.length > 0 && (
                        <span className="inline-flex items-center gap-1">
                           <Clock className="size-3" />
                           {times.join(' · ')}
                        </span>
                     )}
                     {servings ? (
                        <span className="inline-flex items-center gap-1">
                           <Users className="size-3" />
                           {servings} порц.
                        </span>
                     ) : null}
                     {recipe.orgURL && (
                        <a
                           href={recipe.orgURL}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="inline-flex items-center gap-1 hover:underline"
                        >
                           <ExternalLink className="size-3" />
                           источник
                        </a>
                     )}
                  </div>
                  {(recipe.tags ?? []).length > 0 && (
                     <div className="flex flex-wrap gap-1.5">
                        {recipe.tags!.map((t) => (
                           <span
                              key={t.id}
                              className="text-xs border border-border rounded-md px-1.5 py-0.5"
                           >
                              {t.name}
                           </span>
                        ))}
                     </div>
                  )}
               </header>

               {img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                     src={img}
                     alt=""
                     className="w-full max-h-96 object-cover rounded-lg bg-muted"
                  />
               )}

               <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                  <section className="flex flex-col gap-3">
                     <h2 className="text-sm font-semibold">Ингредиенты</h2>
                     <ul className="flex flex-col gap-2">
                        {(recipe.recipeIngredient ?? []).map((ing, i) =>
                           ing.title && !ing.food && !ing.note ? (
                              <li
                                 key={ing.referenceId ?? i}
                                 className="text-xs font-medium text-muted-foreground pt-2"
                              >
                                 {ing.title}
                              </li>
                           ) : (
                              <li key={ing.referenceId ?? i} className="text-sm flex gap-2">
                                 <span className="mt-2 size-1 rounded-full bg-muted-foreground shrink-0" />
                                 <span>{ing.display || ing.originalText || ing.note}</span>
                              </li>
                           )
                        )}
                     </ul>
                  </section>
                  <section className="flex flex-col gap-3">
                     <h2 className="text-sm font-semibold">Приготовление</h2>
                     <ol className="flex flex-col gap-4">
                        {(recipe.recipeInstructions ?? []).map((step, i) => (
                           <li key={step.id ?? i} className="flex gap-3">
                              <span className="size-6 rounded-full bg-accent text-xs font-medium flex items-center justify-center shrink-0">
                                 {i + 1}
                              </span>
                              <div className="flex flex-col gap-1 min-w-0">
                                 {step.title && (
                                    <span className="text-sm font-medium">{step.title}</span>
                                 )}
                                 <p className="text-sm whitespace-pre-line">{step.text}</p>
                              </div>
                           </li>
                        ))}
                     </ol>
                  </section>
               </div>

               {(recipe.notes ?? []).length > 0 && (
                  <section className="flex flex-col gap-2">
                     <h2 className="text-sm font-semibold">Заметки</h2>
                     {recipe.notes!.map((n, i) => (
                        <div key={i} className="text-sm rounded-md border px-3 py-2">
                           {n.title && <div className="font-medium">{n.title}</div>}
                           <p className="whitespace-pre-line text-muted-foreground">{n.text}</p>
                        </div>
                     ))}
                  </section>
               )}
            </article>
         </div>
      </>
   );
}
