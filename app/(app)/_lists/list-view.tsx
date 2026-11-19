'use client';

import { ChevronRight, Home, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { unstable_rethrow, useRouter } from 'next/navigation';
import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/app/page-header';
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { addItem, deleteChecked, deleteItem, moveChecked, setChecked } from './actions';
import {
   MAX_TEXT_LENGTH,
   type ListActionResult,
   type ListData,
   type ListItemView,
   type ListKind,
} from './types';

const TEXT = {
   shopping: {
      title: 'Покупки',
      placeholder: 'Добавить: молоко 2 л',
      checkLabel: 'Куплено',
      checkedTitle: 'Куплено',
      allDone: 'Всё куплено',
      emptyTitle: 'Список покупок пуст',
      emptyHint: 'Добавьте продукт в поле выше или из рецепта — кнопкой «В покупки».',
      move: {
         short: 'Домой',
         full: 'Купленное → домой',
         done: (n: number) => `Перенесено домой: ${n}`,
      },
      clear: {
         full: 'Убрать купленное',
         confirm: 'Убрать купленное?',
         hint: 'Отмеченные пункты удалятся из списка. Чтобы сохранить их в «Дома», нажмите «Купленное → домой».',
      },
   },
   pantry: {
      title: 'Дома',
      placeholder: 'Добавить: рис 1 кг',
      checkLabel: 'Закончилось',
      checkedTitle: 'Закончилось',
      allDone: 'Всё на месте',
      emptyTitle: 'Дома пока ничего не записано',
      emptyHint: 'Добавьте продукты в поле выше или перенесите купленное из «Покупок».',
      move: {
         short: 'Докупить',
         full: 'Докупить всё',
         done: (n: number) => `Добавлено в покупки: ${n}`,
      },
      clear: {
         full: 'Убрать закончившееся',
         confirm: 'Убрать закончившееся?',
         hint: 'Отмеченные пункты удалятся из списка «Дома». Чтобы купить их снова, нажмите «Докупить».',
      },
   },
} as const;

const NO_LABEL = '__none__';
const TEMP_PREFIX = 'tmp-';
const POLL_MS = 20_000;

// Not crypto.randomUUID(): it is missing on plain-HTTP origins (phones on the LAN).
let tempSeq = 0;
const tempId = () => `${TEMP_PREFIX}${Date.now()}-${++tempSeq}`;

type Op =
   | { type: 'check'; id: string; checked: boolean }
   | { type: 'remove'; ids: string[] }
   | { type: 'add'; item: ListItemView };

function apply(items: ListItemView[], op: Op): ListItemView[] {
   switch (op.type) {
      case 'check':
         return items.map((i) => (i.id === op.id ? { ...i, checked: op.checked } : i));
      case 'remove': {
         const ids = new Set(op.ids);
         return items.filter((i) => !ids.has(i.id));
      }
      case 'add':
         return [...items, op.item];
   }
}

const byPosition = (a: ListItemView, b: ListItemView) =>
   a.position - b.position || a.createdAt.localeCompare(b.createdAt);

export function ListView({ kind, data }: { kind: ListKind; data: ListData }) {
   const t = TEXT[kind];
   const router = useRouter();
   const [items, optimistic] = useOptimistic(data.items, apply);
   const [, startTransition] = useTransition();
   const [text, setText] = useState('');
   const [showChecked, setShowChecked] = useState(kind === 'pantry');
   const inputRef = useRef<HTMLInputElement>(null);

   // Both people may have the list open in the shop: pick up the other's ticks.
   useEffect(() => {
      const id = window.setInterval(() => {
         if (document.visibilityState === 'visible') router.refresh();
      }, POLL_MS);
      return () => window.clearInterval(id);
   }, [router]);

   /** Applies `op` at once, runs the server action, rolls back with a toast on error. */
   function run(
      op: Op | null,
      action: () => Promise<ListActionResult>,
      onOk?: (r: ListActionResult) => void
   ) {
      startTransition(async () => {
         if (op) optimistic(op);
         let res: ListActionResult;
         try {
            res = await action();
         } catch (e) {
            // A 401 makes the action redirect to /logout: let Next handle that.
            unstable_rethrow(e);
            res = { ok: false, error: 'Нет связи с сервером' };
         }
         if (!res.ok) toast.error(res.error);
         else onOk?.(res);
      });
   }

   const { groups, checked } = useMemo(() => {
      const known = new Set(data.labels.map((l) => l.id));
      const open = items.filter((i) => !i.checked);
      const byLabel = new Map<string, ListItemView[]>();
      for (const item of open) {
         const key = item.labelId && known.has(item.labelId) ? item.labelId : NO_LABEL;
         const arr = byLabel.get(key) ?? [];
         arr.push(item);
         byLabel.set(key, arr);
      }
      const groups = [
         ...data.labels.map((l) => ({ id: l.id, name: l.name, color: l.color })),
         { id: NO_LABEL, name: 'Без категории', color: '' },
      ]
         .filter((g) => byLabel.has(g.id))
         .map((g) => ({ ...g, items: byLabel.get(g.id)!.sort(byPosition) }));
      return { groups, checked: items.filter((i) => i.checked).sort(byPosition) };
   }, [items, data.labels]);

   const checkedIds = checked.filter((i) => !i.id.startsWith(TEMP_PREFIX)).map((i) => i.id);

   function submit(e: React.FormEvent) {
      e.preventDefault();
      const value = text.trim().replace(/\s+/g, ' ');
      if (!value) return;
      if (value.length > MAX_TEXT_LENGTH) {
         toast.error(`Слишком длинно (больше ${MAX_TEXT_LENGTH} символов)`);
         return;
      }
      setText('');
      inputRef.current?.focus();
      run(
         {
            type: 'add',
            item: {
               id: tempId(),
               text: value,
               checked: false,
               labelId: null,
               position: Number.MAX_SAFE_INTEGER,
               createdAt: new Date().toISOString(),
               recipes: [],
            },
         },
         () => addItem(kind, value)
      );
   }

   const toggle = (item: ListItemView, value: boolean) =>
      run({ type: 'check', id: item.id, checked: value }, () => setChecked(kind, item.id, value));
   const remove = (item: ListItemView) =>
      run({ type: 'remove', ids: [item.id] }, () => deleteItem(kind, item.id));
   const restock = (item: ListItemView) =>
      run(
         { type: 'remove', ids: [item.id] },
         () => moveChecked(kind, [item.id]),
         () => toast.success(`«${item.text}» — в покупках`)
      );
   const moveAll = () =>
      run(
         { type: 'remove', ids: checkedIds },
         () => moveChecked(kind, checkedIds),
         (r) => {
            if (r.ok && r.count) toast.success(t.move.done(r.count));
         }
      );
   const clearAll = () =>
      run({ type: 'remove', ids: checkedIds }, () => deleteChecked(kind, checkedIds));

   const empty = items.length === 0;

   return (
      <>
         <PageHeader title={t.title} count={items.length - checked.length} />
         <form
            onSubmit={submit}
            className="border-b px-4 sm:px-6 py-2 flex items-center gap-2 shrink-0"
         >
            <Input
               ref={inputRef}
               value={text}
               onChange={(e) => setText(e.target.value)}
               placeholder={t.placeholder}
               maxLength={MAX_TEXT_LENGTH}
               enterKeyHint="done"
               autoComplete="off"
               aria-label="Добавить пункт"
            />
            <Button
               type="submit"
               size="icon"
               variant="secondary"
               disabled={!text.trim()}
               aria-label="Добавить"
               title="Добавить"
            >
               <Plus className="size-4" />
            </Button>
         </form>
         <div className="overflow-y-auto overflow-x-hidden flex-1">
            {empty ? (
               <div className="flex flex-col items-center justify-center gap-2 py-24 px-6 text-center">
                  <p className="text-sm font-medium">{t.emptyTitle}</p>
                  <p className="text-sm text-muted-foreground max-w-xs">{t.emptyHint}</p>
               </div>
            ) : (
               <>
                  {groups.length === 0 && (
                     <p className="px-4 sm:px-6 py-6 text-sm text-muted-foreground text-center">
                        {t.allDone}
                     </p>
                  )}
                  {groups.map((g) => (
                     <section key={g.id}>
                        <h2 className="flex items-center gap-2 h-8 px-4 sm:px-6 text-xs font-medium text-muted-foreground bg-sidebar/50 border-b border-border/50">
                           {g.color && (
                              <span
                                 className="size-2 rounded-full shrink-0"
                                 style={{ backgroundColor: g.color }}
                              />
                           )}
                           <span className="truncate">{g.name}</span>
                           <span>{g.items.length}</span>
                        </h2>
                        <ul>
                           {g.items.map((item) => (
                              <Row
                                 key={item.id}
                                 item={item}
                                 checkLabel={t.checkLabel}
                                 onToggle={toggle}
                                 onDelete={remove}
                              />
                           ))}
                        </ul>
                     </section>
                  ))}
                  {checked.length > 0 && (
                     <section>
                        <div className="flex items-center justify-between gap-1 h-11 pl-2 sm:pl-4 pr-2 sm:pr-4 border-b bg-sidebar/50">
                           <button
                              type="button"
                              onClick={() => setShowChecked((v) => !v)}
                              className="flex items-center gap-1 h-9 px-2 rounded-md text-sm font-medium hover:bg-accent min-w-0"
                              aria-expanded={showChecked}
                           >
                              <ChevronRight
                                 className={cn(
                                    'size-4 shrink-0 text-muted-foreground transition-transform',
                                    showChecked && 'rotate-90'
                                 )}
                              />
                              <span className="truncate">
                                 {t.checkedTitle}{' '}
                                 <span className="text-muted-foreground">({checked.length})</span>
                              </span>
                           </button>
                           <div className="flex items-center gap-1 shrink-0">
                              <Button
                                 size="sm"
                                 variant="secondary"
                                 className="h-9"
                                 onClick={moveAll}
                                 disabled={checkedIds.length === 0}
                                 title={t.move.full}
                              >
                                 {kind === 'shopping' ? <Home /> : <ShoppingCart />}
                                 <span className="sm:hidden">{t.move.short}</span>
                                 <span className="hidden sm:inline">{t.move.full}</span>
                              </Button>
                              <AlertDialog>
                                 <AlertDialogTrigger asChild>
                                    <Button
                                       size="sm"
                                       variant="ghost"
                                       className="size-9 px-0 sm:w-auto sm:px-2.5"
                                       disabled={checkedIds.length === 0}
                                       title={t.clear.full}
                                       aria-label={t.clear.full}
                                    >
                                       <Trash2 />
                                       <span className="hidden sm:inline">{t.clear.full}</span>
                                    </Button>
                                 </AlertDialogTrigger>
                                 <AlertDialogContent>
                                    <AlertDialogHeader>
                                       <AlertDialogTitle>{t.clear.confirm}</AlertDialogTitle>
                                       <AlertDialogDescription>
                                          {t.clear.hint}
                                       </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                       <AlertDialogCancel>Отмена</AlertDialogCancel>
                                       <AlertDialogAction onClick={clearAll}>
                                          Убрать ({checkedIds.length})
                                       </AlertDialogAction>
                                    </AlertDialogFooter>
                                 </AlertDialogContent>
                              </AlertDialog>
                           </div>
                        </div>
                        {showChecked && (
                           <ul>
                              {checked.map((item) => (
                                 <Row
                                    key={item.id}
                                    item={item}
                                    checkLabel={t.checkLabel}
                                    onToggle={toggle}
                                    onDelete={remove}
                                    onRestock={kind === 'pantry' ? restock : undefined}
                                 />
                              ))}
                           </ul>
                        )}
                     </section>
                  )}
               </>
            )}
         </div>
      </>
   );
}

function Row({
   item,
   checkLabel,
   onToggle,
   onDelete,
   onRestock,
}: {
   item: ListItemView;
   checkLabel: string;
   onToggle: (item: ListItemView, checked: boolean) => void;
   onDelete: (item: ListItemView) => void;
   onRestock?: (item: ListItemView) => void;
}) {
   const pending = item.id.startsWith(TEMP_PREFIX);
   return (
      <li
         className={cn(
            'flex items-center gap-1 min-h-11 pl-4 sm:pl-6 pr-1 sm:pr-4 border-b border-border/50',
            pending && 'opacity-60'
         )}
      >
         <label className="flex flex-1 items-center gap-3 min-w-0 min-h-11 py-1.5 cursor-pointer">
            <Checkbox
               checked={item.checked}
               onCheckedChange={(v) => onToggle(item, v === true)}
               disabled={pending}
               aria-label={checkLabel}
               className="size-5"
            />
            <span className="flex flex-col min-w-0">
               <span
                  className={cn(
                     'text-sm break-words',
                     item.checked && 'line-through text-muted-foreground'
                  )}
               >
                  {item.text}
               </span>
               {item.recipes.length > 0 && (
                  <span className="text-xs text-muted-foreground truncate">
                     {item.recipes.join(', ')}
                  </span>
               )}
            </span>
         </label>
         {onRestock && (
            <Button
               size="sm"
               variant="ghost"
               className="h-9 shrink-0"
               onClick={() => onRestock(item)}
               disabled={pending}
               title="Вернуть в «Покупки»"
            >
               <ShoppingCart />
               Докупить
            </Button>
         )}
         <button
            type="button"
            onClick={() => onDelete(item)}
            disabled={pending}
            className="size-9 shrink-0 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
            aria-label={`Удалить «${item.text}»`}
            title="Удалить"
         >
            <X className="size-4" />
         </button>
      </li>
   );
}
