/** Shared between the server loader, the server actions and the client list view. */

export type ListKind = 'shopping' | 'pantry';

export const LIST_KINDS: readonly ListKind[] = ['shopping', 'pantry'];

/** The slice of a Mealie shopping-list item the client needs. */
export type ListItemView = {
   id: string;
   text: string;
   checked: boolean;
   labelId: string | null;
   position: number;
   createdAt: string;
   /** Names of the recipes this item came from (may be empty). */
   recipes: string[];
};

export type ListLabel = { id: string; name: string; color: string };

export type ListData = {
   items: ListItemView[];
   /** Labels in the list's own order (Mealie label settings), then any others by name. */
   labels: ListLabel[];
};

export type ListActionResult = { ok: true; count?: number } | { ok: false; error: string };

export const MAX_TEXT_LENGTH = 200;
