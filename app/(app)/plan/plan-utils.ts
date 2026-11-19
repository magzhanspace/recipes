import { addDays, formatDay, isIsoDate, weekStart } from '@/lib/dates';
import type { PlanEntryType } from '@/lib/mealie/types';

/** Display order within a day, with Russian labels. */
export const MEALS: { id: PlanEntryType; label: string }[] = [
   { id: 'breakfast', label: 'Завтрак' },
   { id: 'lunch', label: 'Обед' },
   { id: 'dinner', label: 'Ужин' },
   { id: 'snack', label: 'Перекус' },
   { id: 'side', label: 'Гарнир' },
   { id: 'dessert', label: 'Десерт' },
   { id: 'drink', label: 'Напиток' },
];

export const MEAL_LABEL = Object.fromEntries(MEALS.map((m) => [m.id, m.label])) as Record<
   PlanEntryType,
   string
>;

export const MEAL_ORDER = Object.fromEntries(MEALS.map((m, i) => [m.id, i])) as Record<
   PlanEntryType,
   number
>;

export function isEntryType(value: unknown): value is PlanEntryType {
   return MEALS.some((m) => m.id === value);
}

/** A YYYY-MM-DD string that is also a real calendar date (isIsoDate is only a regex). */
export function isRealDate(value: unknown): value is string {
   if (!isIsoDate(value)) return false;
   const d = new Date(`${value}T00:00:00Z`);
   return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Monday of the requested week, or null when the value is missing or not a real date. */
export function parseWeek(value: unknown): string | null {
   const v = Array.isArray(value) ? value[0] : value;
   return isRealDate(v) ? weekStart(v) : null;
}

/** «16–22 нояб.», «29 дек. – 4 янв.»; the year is added when it isn't the current one. */
export function formatWeekRange(start: string, today: string): string {
   const end = addDays(start, 6);
   const withYear = end.slice(0, 4) !== today.slice(0, 4);
   const endText = formatDay(end, {
      day: 'numeric',
      month: 'short',
      ...(withYear ? { year: 'numeric' } : {}),
   });
   if (start.slice(0, 7) === end.slice(0, 7)) {
      return `${formatDay(start, { day: 'numeric' })}–${endText}`;
   }
   return `${formatDay(start, { day: 'numeric', month: 'short' })} – ${endText}`;
}

/** 1 рецепт, 2 рецепта, 5 рецептов. */
export function plural(n: number, one: string, few: string, many: string): string {
   const mod10 = n % 10;
   const mod100 = n % 100;
   if (mod10 === 1 && mod100 !== 11) return one;
   if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
   return many;
}
