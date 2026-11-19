import 'server-only';

import { mealie } from '@/lib/mealie/client';
import { getListByName, PANTRY_LIST_NAME, SHOPPING_LIST_NAME } from '@/lib/mealie/lists';
import type { ShoppingListItem } from '@/lib/mealie/types';
import type { ListData, ListKind, ListLabel } from './types';

export const LIST_NAMES: Record<ListKind, string> = {
   shopping: SHOPPING_LIST_NAME,
   pantry: PANTRY_LIST_NAME,
};

export const LIST_PATHS: Record<ListKind, string> = {
   shopping: '/shopping',
   pantry: '/pantry',
};

/** Mealie's `display` is usually right; rebuild it only if it is empty. */
export function itemText(item: ShoppingListItem): string {
   const display = item.display?.trim();
   if (display) return display;
   const parts = [
      item.quantity ? String(item.quantity) : '',
      item.unit?.name ?? '',
      item.food?.name ?? '',
      item.note ?? '',
   ];
   return parts.filter(Boolean).join(' ') || 'Без названия';
}

export async function loadList(kind: ListKind): Promise<ListData> {
   const api = await mealie();
   const list = await getListByName(api, LIST_NAMES[kind]);

   const recipeNames = new Map(
      (list.recipeReferences ?? []).map((r) => [r.recipeId, r.recipe?.name ?? ''])
   );

   const labels: ListLabel[] = [...(list.labelSettings ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((s) => ({ id: s.label.id, name: s.label.name, color: s.label.color }));
   const known = new Set(labels.map((l) => l.id));
   const extra = new Map<string, ListLabel>();
   for (const item of list.listItems) {
      if (item.label && !known.has(item.label.id)) {
         extra.set(item.label.id, {
            id: item.label.id,
            name: item.label.name,
            color: item.label.color,
         });
      }
   }
   labels.push(...[...extra.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru')));

   return {
      labels,
      items: list.listItems.map((item) => ({
         id: item.id,
         text: itemText(item),
         checked: item.checked,
         labelId: item.label?.id ?? item.labelId ?? null,
         position: item.position ?? 0,
         createdAt: item.createdAt ?? '',
         recipes: [
            ...new Set(
               (item.recipeReferences ?? [])
                  .map((r) => recipeNames.get(r.recipeId))
                  .filter((n): n is string => !!n)
            ),
         ],
      })),
   };
}
