'use server';

import { revalidatePath } from 'next/cache';
import { check, mealie, type Mealie } from '@/lib/mealie/client';
import { getListByName } from '@/lib/mealie/lists';
import type { ShoppingList, ShoppingListItem } from '@/lib/mealie/types';
import { LIST_NAMES, LIST_PATHS } from './data';
import { LIST_KINDS, MAX_TEXT_LENGTH, type ListActionResult, type ListKind } from './types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IDS = 500;

const isKind = (v: unknown): v is ListKind =>
   typeof v === 'string' && (LIST_KINDS as readonly string[]).includes(v);
const isId = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);
const isIdList = (v: unknown): v is string[] =>
   Array.isArray(v) && v.length > 0 && v.length <= MAX_IDS && v.every(isId);

const other = (kind: ListKind): ListKind => (kind === 'shopping' ? 'pantry' : 'shopping');

const BAD_INPUT: ListActionResult = { ok: false, error: 'Неверные данные' };
const GONE: ListActionResult = {
   ok: false,
   error: 'Этот пункт уже изменили или удалили — список обновлён',
};

/** Always the server's fresh copy: two people edit the same lists at once. */
async function freshList(api: Mealie, kind: ListKind): Promise<ShoppingList> {
   return getListByName(api, LIST_NAMES[kind]);
}

function revalidate(...kinds: ListKind[]) {
   for (const k of kinds) revalidatePath(LIST_PATHS[k]);
}

/**
 * Mealie's item PUT replaces the whole item: anything left out falls back to
 * its default (the note is wiped, recipe references are dropped). So the body
 * is the server's fresh copy with only `checked` changed.
 */
function updateBody(item: ShoppingListItem, checked: boolean) {
   return {
      shoppingListId: item.shoppingListId,
      quantity: item.quantity,
      unitId: item.unitId ?? null,
      foodId: item.foodId ?? null,
      labelId: item.labelId ?? null,
      note: item.note ?? '',
      display: item.display ?? '',
      position: item.position ?? 0,
      extras: item.extras ?? {},
      checked,
      recipeReferences: (item.recipeReferences ?? []).map((r) => ({
         id: r.id,
         shoppingListItemId: r.shoppingListItemId,
         recipeId: r.recipeId,
         recipeQuantity: r.recipeQuantity ?? 0,
         recipeScale: r.recipeScale ?? 1,
         recipeNote: r.recipeNote ?? null,
      })),
   };
}

/** Adds a free-text (note) item. Quantity 0 so Mealie doesn't prefix it with «1». */
export async function addItem(kind: ListKind, rawText: string): Promise<ListActionResult> {
   if (!isKind(kind) || typeof rawText !== 'string') return BAD_INPUT;
   const text = rawText.trim().replace(/\s+/g, ' ');
   if (!text) return { ok: false, error: 'Пустая строка' };
   if (text.length > MAX_TEXT_LENGTH)
      return { ok: false, error: `Слишком длинно (больше ${MAX_TEXT_LENGTH} символов)` };

   const api = await mealie();
   const list = await freshList(api, kind);
   // Mealie may merge this into an existing unchecked item with the same
   // note (it then shows up in updatedItems, not createdItems): fine either way.
   const err = check(
      await api.POST('/api/households/shopping/items', {
         body: {
            shoppingListId: list.id,
            note: text,
            display: '',
            quantity: 0,
            checked: false,
            position: 0,
            extras: {},
            recipeReferences: [],
         },
      })
   );
   if (err) return { ok: false, error: err };
   revalidate(kind);
   return { ok: true };
}

/** Sets (not toggles) `checked`, so a repeated or late request is harmless. */
export async function setChecked(
   kind: ListKind,
   itemId: string,
   checked: boolean
): Promise<ListActionResult> {
   if (!isKind(kind) || !isId(itemId) || typeof checked !== 'boolean') return BAD_INPUT;

   const api = await mealie();
   const list = await freshList(api, kind);
   const item = list.listItems.find((i) => i.id === itemId);
   if (!item) {
      revalidate(kind);
      return GONE;
   }
   if (item.checked === checked) {
      revalidate(kind);
      return { ok: true };
   }
   const err = check(
      await api.PUT('/api/households/shopping/items/{item_id}', {
         params: { path: { item_id: item.id } },
         body: updateBody(item, checked),
      })
   );
   if (err) return { ok: false, error: err };
   revalidate(kind);
   return { ok: true };
}

export async function deleteItem(kind: ListKind, itemId: string): Promise<ListActionResult> {
   if (!isKind(kind) || !isId(itemId)) return BAD_INPUT;

   const api = await mealie();
   const list = await freshList(api, kind);
   if (!list.listItems.some((i) => i.id === itemId)) {
      // Already gone (the other person deleted it): that's what we wanted.
      revalidate(kind);
      return { ok: true };
   }
   const err = check(
      await api.DELETE('/api/households/shopping/items/{item_id}', {
         params: { path: { item_id: itemId } },
      })
   );
   if (err) return { ok: false, error: err };
   revalidate(kind);
   return { ok: true };
}

/**
 * The items the client saw as checked that are still checked on this list
 * right now. Anything the other person unchecked meanwhile is left alone, and
 * anything they checked that this client hasn't seen yet is not touched either.
 */
function stillChecked(list: ShoppingList, ids: string[]): ShoppingListItem[] {
   const wanted = new Set(ids);
   return list.listItems.filter((i) => i.checked && wanted.has(i.id));
}

/** «Убрать купленное»: deletes the given items if they are still checked. */
export async function deleteChecked(kind: ListKind, ids: string[]): Promise<ListActionResult> {
   if (!isKind(kind) || !isIdList(ids)) return BAD_INPUT;

   const api = await mealie();
   const list = await freshList(api, kind);
   const items = stillChecked(list, ids);
   if (items.length === 0) {
      revalidate(kind);
      return { ok: true, count: 0 };
   }
   const err = check(
      await api.DELETE('/api/households/shopping/items', {
         params: { query: { ids: items.map((i) => i.id) } },
      })
   );
   if (err) return { ok: false, error: err };
   revalidate(kind);
   return { ok: true, count: items.length };
}

/**
 * Moves checked items to the other list, unchecked: «Купленное → домой» from
 * «Покупки», «Докупить» from «Дома». Creates the copies first and deletes the
 * originals only after that succeeded, so a failure never loses an item.
 */
export async function moveChecked(from: ListKind, ids: string[]): Promise<ListActionResult> {
   if (!isKind(from) || !isIdList(ids)) return BAD_INPUT;
   const to = other(from);

   const api = await mealie();
   const [source, target] = await Promise.all([freshList(api, from), freshList(api, to)]);
   const items = stillChecked(source, ids);
   if (items.length === 0) {
      revalidate(from, to);
      return { ok: true, count: 0 };
   }

   const created = await api.POST('/api/households/shopping/items/create-bulk', {
      body: items.map((i) => ({
         shoppingListId: target.id,
         quantity: i.quantity,
         unitId: i.unitId ?? null,
         foodId: i.foodId ?? null,
         labelId: i.labelId ?? null,
         note: i.note ?? '',
         display: '',
         checked: false,
         position: 0,
         extras: {},
         recipeReferences: [],
      })),
   });
   const createErr = check(created);
   if (createErr) return { ok: false, error: `Не удалось перенести. ${createErr}` };

   const deleteErr = check(
      await api.DELETE('/api/households/shopping/items', {
         params: { query: { ids: items.map((i) => i.id) } },
      })
   );
   revalidate(from, to);
   if (deleteErr) {
      return {
         ok: false,
         error: `Пункты добавлены в «${LIST_NAMES[to]}», но не удалены из «${LIST_NAMES[from]}». Удалите их вручную, не повторяйте перенос. ${deleteErr}`,
      };
   }
   return { ok: true, count: items.length };
}
