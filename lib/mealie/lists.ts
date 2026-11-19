import 'server-only';

import { unwrap, type Mealie } from './client';
import type { ShoppingList } from './types';

/** The two household lists, created during setup. Names are the contract. */
export const SHOPPING_LIST_NAME = 'Покупки';
export const PANTRY_LIST_NAME = 'Дома';

/** Finds a list by name, creating it if someone deleted it in Mealie. */
export async function getListByName(api: Mealie, name: string): Promise<ShoppingList> {
   const all = unwrap(
      await api.GET('/api/households/shopping/lists', { params: { query: { perPage: -1 } } }),
      'shopping/lists'
   );
   let summary = all.items.find((l) => l.name === name);
   if (!summary) {
      summary = unwrap(
         await api.POST('/api/households/shopping/lists', { body: { name, extras: {} } }),
         'create shopping list'
      );
   }
   return unwrap(
      await api.GET('/api/households/shopping/lists/{item_id}', {
         params: { path: { item_id: summary.id } },
      }),
      'shopping list'
   );
}
