'use client';

import { CalendarPlus, ShoppingCart } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { addDays, formatDay } from '@/lib/dates';
import type { PlanEntryType } from '@/lib/mealie/types';
import { addToPlan, addToShopping } from '../actions';

const MEALS: { id: PlanEntryType; label: string }[] = [
   { id: 'breakfast', label: 'Завтрак' },
   { id: 'lunch', label: 'Обед' },
   { id: 'dinner', label: 'Ужин' },
   { id: 'snack', label: 'Перекус' },
];

export function RecipeActions({ recipeId, today }: { recipeId: string; today: string }) {
   const [open, setOpen] = useState(false);
   const [date, setDate] = useState(today);
   const [meal, setMeal] = useState<PlanEntryType>('dinner');
   const [pending, startTransition] = useTransition();
   const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

   const plan = () =>
      startTransition(async () => {
         const res = await addToPlan(recipeId, date, meal);
         if (!res.ok) return void toast.error(res.error);
         setOpen(false);
         toast.success(
            `В меню: ${formatDay(date)}, ${MEALS.find((m) => m.id === meal)?.label.toLowerCase()}`
         );
      });

   const shop = () =>
      startTransition(async () => {
         const res = await addToShopping(recipeId);
         if (!res.ok) return void toast.error(res.error);
         toast.success('Ингредиенты добавлены в «Покупки»');
      });

   return (
      <>
         <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
               <Button size="xs" variant="secondary" disabled={pending}>
                  <CalendarPlus className="size-4" />
                  <span className="hidden sm:inline">В меню</span>
               </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 flex flex-col gap-3">
               <div className="flex flex-wrap gap-1.5">
                  {MEALS.map((m) => (
                     <Button
                        key={m.id}
                        size="xs"
                        variant={meal === m.id ? 'default' : 'outline'}
                        onClick={() => setMeal(m.id)}
                     >
                        {m.label}
                     </Button>
                  ))}
               </div>
               <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-auto">
                  {days.map((d) => (
                     <Button
                        key={d}
                        size="xs"
                        variant={date === d ? 'default' : 'ghost'}
                        className="justify-start"
                        onClick={() => setDate(d)}
                     >
                        {d === today ? 'Сегодня' : formatDay(d)}
                     </Button>
                  ))}
               </div>
               <Button size="sm" onClick={plan} disabled={pending}>
                  Добавить в меню
               </Button>
            </PopoverContent>
         </Popover>
         <Button size="xs" variant="secondary" onClick={shop} disabled={pending}>
            <ShoppingCart className="size-4" />
            <span className="hidden sm:inline">В покупки</span>
         </Button>
      </>
   );
}
