'use server';

import { revalidatePath } from 'next/cache';
import { addDays, weekStart } from '@/lib/dates';
import { check, mealie } from '@/lib/mealie/client';
import { getListByName, SHOPPING_LIST_NAME } from '@/lib/mealie/lists';
import type { PlanEntryType } from '@/lib/mealie/types';
import { isEntryType, isRealDate, plural } from './plan-utils';

export type PlanActionResult = { ok: true; message?: string } | { ok: false; error: string };

const MAX_TITLE = 120;

/** Mealie plan entry ids are integers (item_id: integer in the OpenAPI schema). */
function isEntryId(value: unknown): value is number {
   return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

export async function deletePlanEntry(id: number): Promise<PlanActionResult> {
   if (!isEntryId(id)) return { ok: false, error: 'Неверная запись' };
   const api = await mealie();
   const err = check(
      await api.DELETE('/api/households/mealplans/{item_id}', {
         params: { path: { item_id: id } },
      })
   );
   if (err) return { ok: false, error: err };
   revalidatePath('/plan');
   return { ok: true };
}

export async function addPlanNote(
   date: string,
   entryType: PlanEntryType,
   rawTitle: string
): Promise<PlanActionResult> {
   if (!isRealDate(date) || !isEntryType(entryType))
      return { ok: false, error: 'Неверная дата или приём пищи' };
   const title = typeof rawTitle === 'string' ? rawTitle.trim().replace(/\s+/g, ' ') : '';
   if (!title) return { ok: false, error: 'Напишите заметку' };
   if (title.length > MAX_TITLE)
      return { ok: false, error: `Слишком длинно, максимум ${MAX_TITLE} символов` };

   const api = await mealie();
   const err = check(
      await api.POST('/api/households/mealplans', {
         body: { date, entryType, title, text: '', recipeScale: 1 },
      })
   );
   if (err) return { ok: false, error: err };
   revalidatePath('/plan');
   return { ok: true };
}

/** Adds the ingredients of every recipe planned for the week to «Покупки», in one call. */
export async function addWeekToShopping(week: string): Promise<PlanActionResult> {
   if (!isRealDate(week)) return { ok: false, error: 'Неверная неделя' };
   const start = weekStart(week);
   const api = await mealie();

   // Entries are re-read here: the client only says which week, never which recipes.
   const res = await api.GET('/api/households/mealplans', {
      params: { query: { start_date: start, end_date: addDays(start, 6), perPage: -1 } },
   });
   const err = check(res);
   if (err || !res.data) return { ok: false, error: err ?? 'Mealie не вернул меню' };

   const recipes = res.data.items.filter((e): e is typeof e & { recipeId: string } => !!e.recipeId);
   if (recipes.length === 0)
      return { ok: false, error: 'На этой неделе нет рецептов — нечего добавлять' };

   const list = await getListByName(api, SHOPPING_LIST_NAME);
   const addErr = check(
      await api.POST('/api/households/shopping/lists/{item_id}/recipe', {
         params: { path: { item_id: list.id } },
         body: recipes.map((e) => ({
            recipeId: e.recipeId,
            recipeIncrementQuantity: e.recipeScale || 1,
         })),
      })
   );
   if (addErr) return { ok: false, error: addErr };

   revalidatePath('/plan');
   revalidatePath('/shopping');
   const n = new Set(recipes.map((e) => e.recipeId)).size;
   return {
      ok: true,
      message: `Ингредиенты ${n} ${plural(n, 'рецепта', 'рецептов', 'рецептов')} добавлены в «Покупки»`,
   };
}
