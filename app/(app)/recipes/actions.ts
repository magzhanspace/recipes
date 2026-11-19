'use server';

import { revalidatePath } from 'next/cache';
import { check, mealie, unwrap } from '@/lib/mealie/client';
import { getListByName, SHOPPING_LIST_NAME } from '@/lib/mealie/lists';
import { halalIssues } from '@/lib/halal';
import { isIsoDate } from '@/lib/dates';
import type { PlanEntryType } from '@/lib/mealie/types';

export type ActionResult =
   | { ok: true; slug?: string; warnings?: string[] }
   | { ok: false; error: string };

export async function importRecipe(rawUrl: string): Promise<ActionResult> {
   let url: URL;
   try {
      url = new URL(rawUrl.trim());
   } catch {
      return { ok: false, error: 'Это не похоже на ссылку' };
   }
   if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return { ok: false, error: 'Нужна ссылка http(s)' };
   }
   const api = await mealie();
   const res = await api.POST('/api/recipes/create/url', {
      body: { url: url.toString(), includeTags: true, includeCategories: true },
   });
   const err = check(res);
   if (err) return { ok: false, error: `Не удалось импортировать. ${err}` };
   const slug = res.data as string;

   const recipe = unwrap(
      await api.GET('/api/recipes/{slug}', { params: { path: { slug } } }),
      'recipe'
   );
   revalidatePath('/recipes');
   return { ok: true, slug, warnings: halalIssues(recipe) };
}

const ENTRY_TYPES: PlanEntryType[] = [
   'breakfast',
   'lunch',
   'dinner',
   'side',
   'snack',
   'drink',
   'dessert',
];

export async function addToPlan(
   recipeId: string,
   date: string,
   entryType: PlanEntryType
): Promise<ActionResult> {
   if (!isIsoDate(date) || !ENTRY_TYPES.includes(entryType))
      return { ok: false, error: 'Неверная дата или приём пищи' };
   const api = await mealie();
   const err = check(
      await api.POST('/api/households/mealplans', {
         body: { date, entryType, recipeId, title: '', text: '', recipeScale: 1 },
      })
   );
   if (err) return { ok: false, error: err };
   revalidatePath('/plan');
   return { ok: true };
}

export async function addToShopping(recipeId: string): Promise<ActionResult> {
   const api = await mealie();
   const list = await getListByName(api, SHOPPING_LIST_NAME);
   const err = check(
      await api.POST('/api/households/shopping/lists/{item_id}/recipe', {
         params: { path: { item_id: list.id } },
         body: [{ recipeId, recipeIncrementQuantity: 1 }],
      })
   );
   if (err) return { ok: false, error: err };
   revalidatePath('/shopping');
   return { ok: true };
}
