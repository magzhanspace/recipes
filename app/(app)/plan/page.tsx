import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ImageOff, StickyNote } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { addDays, formatDay, isoDate, weekStart } from '@/lib/dates';
import { recipeImage } from '@/lib/images';
import { mealie, unwrap } from '@/lib/mealie/client';
import type { PlanEntry } from '@/lib/mealie/types';
import { cn } from '@/lib/utils';
import { AddNote, DeleteEntry, WeekToShopping } from './plan-controls';
import { formatWeekRange, MEAL_LABEL, MEAL_ORDER, parseWeek } from './plan-utils';

export const metadata: Metadata = { title: 'Меню на неделю' };

export default async function PlanPage({
   searchParams,
}: {
   searchParams: Promise<{ week?: string | string[] }>;
}) {
   const { week: rawWeek } = await searchParams;
   const today = isoDate();
   const thisWeek = weekStart(today);
   const start = parseWeek(rawWeek) ?? thisWeek;
   const end = addDays(start, 6);
   const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

   const api = await mealie();
   const data = unwrap(
      await api.GET('/api/households/mealplans', {
         params: { query: { start_date: start, end_date: end, perPage: -1 } },
      }),
      'mealplans'
   );

   // Mealie's default order is date desc; sort by day, then meal, then creation.
   const entries = [...data.items].sort(
      (a, b) =>
         a.date.localeCompare(b.date) ||
         (MEAL_ORDER[a.entryType] ?? 99) - (MEAL_ORDER[b.entryType] ?? 99) ||
         a.id - b.id
   );
   // Multi-day entries (endDate) are shown on their start day only.
   const byDay = new Map<string, PlanEntry[]>(days.map((d) => [d, []]));
   for (const e of entries) byDay.get(e.date)?.push(e);
   const recipeCount = entries.filter((e) => e.recipeId).length;

   const weekHref = (w: string) => (w === thisWeek ? '/plan' : `/plan?week=${w}`);

   return (
      <>
         <PageHeader title={formatWeekRange(start, today)} count={entries.length || undefined}>
            <div className="flex items-center">
               <Button asChild size="xs" variant="ghost" aria-label="Предыдущая неделя">
                  <Link href={weekHref(addDays(start, -7))}>
                     <ChevronLeft className="size-4" />
                  </Link>
               </Button>
               <Button
                  asChild
                  size="xs"
                  variant="ghost"
                  className={cn(start === thisWeek && 'text-muted-foreground')}
               >
                  <Link href="/plan">Сегодня</Link>
               </Button>
               <Button asChild size="xs" variant="ghost" aria-label="Следующая неделя">
                  <Link href={weekHref(addDays(start, 7))}>
                     <ChevronRight className="size-4" />
                  </Link>
               </Button>
            </div>
            <WeekToShopping week={start} recipeCount={recipeCount} />
         </PageHeader>
         <div className="overflow-auto flex-1">
            {entries.length === 0 && (
               <div className="border-b px-4 sm:px-6 py-3 text-sm text-muted-foreground">
                  На эту неделю пока ничего не запланировано. Рецепты добавляются со страницы
                  рецепта кнопкой «В меню», а заметки — здесь, у нужного дня.
               </div>
            )}
            <ul>
               {days.map((day) => (
                  <DayRow
                     key={day}
                     day={day}
                     isToday={day === today}
                     entries={byDay.get(day) ?? []}
                  />
               ))}
            </ul>
         </div>
      </>
   );
}

function DayRow({
   day,
   isToday,
   entries,
}: {
   day: string;
   isToday: boolean;
   entries: PlanEntry[];
}) {
   const weekday = formatDay(day, { weekday: 'long' });
   const dayName = weekday.charAt(0).toUpperCase() + weekday.slice(1);
   const dateText = formatDay(day, { day: 'numeric', month: 'short' });
   const dayLabel = `${weekday}, ${dateText}`;

   return (
      <li
         className={cn(
            'border-b border-border/50 px-4 sm:px-6 py-2 sm:flex sm:gap-4',
            isToday && 'bg-sidebar/40'
         )}
         aria-current={isToday ? 'date' : undefined}
      >
         <div className="flex items-center justify-between gap-2 h-8 sm:w-40 sm:shrink-0 sm:flex-col sm:items-start sm:justify-start sm:h-auto sm:pt-1.5 sm:gap-1">
            <div className="flex items-baseline gap-2 min-w-0">
               <span className={cn('text-sm font-medium', isToday && 'text-primary')}>
                  {dayName}
               </span>
               <span className="text-xs text-muted-foreground">{dateText}</span>
               {isToday && (
                  <span className="text-xs bg-accent rounded-md px-1.5 py-0.5">Сегодня</span>
               )}
            </div>
            <div className="sm:-ml-2">
               <AddNote date={day} dayLabel={dayLabel} />
            </div>
         </div>
         <div className="min-w-0 flex-1">
            {entries.length === 0 ? (
               <div className="h-9 flex items-center text-[13px] text-muted-foreground">
                  <span>Ничего не запланировано ·&nbsp;</span>
                  <Link href="/recipes" className="underline-offset-4 hover:underline">
                     Выбрать рецепт
                  </Link>
               </div>
            ) : (
               <ul>
                  {entries.map((e) => (
                     <EntryRow key={e.id} entry={e} />
                  ))}
               </ul>
            )}
         </div>
      </li>
   );
}

function EntryRow({ entry }: { entry: PlanEntry }) {
   const meal = MEAL_LABEL[entry.entryType] ?? entry.entryType;
   const recipe = entry.recipe;
   const img = recipe ? recipeImage(recipe, 'tiny-original.webp') : null;
   const label = recipe?.name || entry.title || (entry.recipeId ? 'Рецепт удалён' : 'Заметка');

   const thumb = recipe ? (
      img ? (
         // eslint-disable-next-line @next/next/no-img-element
         <img
            src={img}
            alt=""
            className="size-7 rounded-md object-cover shrink-0 bg-muted"
            loading="lazy"
         />
      ) : (
         <div className="size-7 rounded-md bg-muted flex items-center justify-center shrink-0">
            <ImageOff className="size-3.5 text-muted-foreground" />
         </div>
      )
   ) : (
      <div className="size-7 rounded-md border border-dashed flex items-center justify-center shrink-0">
         <StickyNote className="size-3.5 text-muted-foreground" />
      </div>
   );

   return (
      <li className="flex items-center gap-2.5 min-h-10 py-1">
         <span className="w-16 shrink-0 text-xs text-muted-foreground">{meal}</span>
         {recipe?.slug ? (
            <Link
               href={`/recipes/${recipe.slug}`}
               className="flex items-center gap-2.5 min-w-0 flex-1 rounded-md hover:bg-sidebar/50 -mx-1 px-1 py-0.5"
            >
               {thumb}
               <span className="text-sm font-medium truncate">{label}</span>
            </Link>
         ) : (
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
               {thumb}
               <div className="min-w-0">
                  <p
                     className={cn(
                        'text-sm truncate',
                        entry.recipeId && !recipe && 'text-muted-foreground'
                     )}
                  >
                     {label}
                  </p>
                  {entry.text && (
                     <p className="text-xs text-muted-foreground truncate">{entry.text}</p>
                  )}
               </div>
            </div>
         )}
         <DeleteEntry id={entry.id} label={label} />
      </li>
   );
}
