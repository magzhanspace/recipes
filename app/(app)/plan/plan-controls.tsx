'use client';

import { Plus, ShoppingCart, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { PlanEntryType } from '@/lib/mealie/types';
import { addPlanNote, addWeekToShopping, deletePlanEntry } from './actions';
import { MEALS } from './plan-utils';

const FAILED = 'Не получилось, попробуйте ещё раз';
const NOTE_PRESETS = ['Едим в гостях', 'Остатки', 'Доставка'];

export function DeleteEntry({ id, label }: { id: number; label: string }) {
   const [pending, startTransition] = useTransition();
   const remove = () =>
      startTransition(async () => {
         try {
            const res = await deletePlanEntry(id);
            if (!res.ok) toast.error(res.error);
         } catch {
            toast.error(FAILED);
         }
      });

   return (
      <Button
         size="xs"
         variant="ghost"
         className="shrink-0 text-muted-foreground hover:text-foreground"
         onClick={remove}
         disabled={pending}
         aria-label={`Убрать «${label}» из меню`}
         title="Убрать из меню"
      >
         <X className="size-3.5" />
      </Button>
   );
}

export function AddNote({ date, dayLabel }: { date: string; dayLabel: string }) {
   const [open, setOpen] = useState(false);
   const [title, setTitle] = useState('');
   const [meal, setMeal] = useState<PlanEntryType>('dinner');
   const [pending, startTransition] = useTransition();

   const submit = (e: React.FormEvent) => {
      e.preventDefault();
      startTransition(async () => {
         try {
            const res = await addPlanNote(date, meal, title);
            if (!res.ok) return void toast.error(res.error);
            setOpen(false);
            setTitle('');
         } catch {
            toast.error(FAILED);
         }
      });
   };

   return (
      <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger asChild>
            <Button
               size="xxs"
               variant="ghost"
               className="text-muted-foreground hover:text-foreground"
               aria-label={`Добавить заметку на ${dayLabel}`}
            >
               <Plus className="size-3.5" />
               Заметка
            </Button>
         </PopoverTrigger>
         <PopoverContent align="end" className="w-72 p-3">
            <form onSubmit={submit} className="flex flex-col gap-3">
               <p className="text-xs text-muted-foreground">Заметка на {dayLabel}</p>
               <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например, «Остатки»"
                  maxLength={120}
                  autoFocus
               />
               <div className="flex flex-wrap gap-1.5">
                  {NOTE_PRESETS.map((p) => (
                     <Button
                        key={p}
                        type="button"
                        size="xxs"
                        variant="outline"
                        onClick={() => setTitle(p)}
                     >
                        {p}
                     </Button>
                  ))}
               </div>
               <div className="flex flex-wrap gap-1.5">
                  {MEALS.map((m) => (
                     <Button
                        key={m.id}
                        type="button"
                        size="xxs"
                        variant={meal === m.id ? 'default' : 'ghost'}
                        onClick={() => setMeal(m.id)}
                        aria-pressed={meal === m.id}
                     >
                        {m.label}
                     </Button>
                  ))}
               </div>
               <Button type="submit" size="sm" disabled={pending || !title.trim()}>
                  Добавить
               </Button>
            </form>
         </PopoverContent>
      </Popover>
   );
}

export function WeekToShopping({ week, recipeCount }: { week: string; recipeCount: number }) {
   const [pending, startTransition] = useTransition();
   const run = () =>
      startTransition(async () => {
         try {
            const res = await addWeekToShopping(week);
            if (!res.ok) return void toast.error(res.error);
            toast.success(res.message ?? 'Добавлено в «Покупки»');
         } catch {
            toast.error(FAILED);
         }
      });

   return (
      <Button
         size="xs"
         variant="secondary"
         onClick={run}
         disabled={pending || recipeCount === 0}
         aria-label="Ингредиенты недели в покупки"
         title={
            recipeCount === 0 ? 'На этой неделе нет рецептов' : 'Ингредиенты недели → в покупки'
         }
      >
         <ShoppingCart className="size-4" />
         <span className="hidden md:inline">Ингредиенты недели → в покупки</span>
      </Button>
   );
}
