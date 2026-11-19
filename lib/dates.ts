/**
 * The household lives in Asia/Almaty, the server runs in another timezone.
 * All "today" and week maths go through these helpers.
 */
export const HOUSEHOLD_TZ = 'Asia/Almaty';

/** YYYY-MM-DD for the given instant in the household's timezone. */
export function isoDate(at: Date = new Date()): string {
   return new Intl.DateTimeFormat('en-CA', {
      timeZone: HOUSEHOLD_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
   }).format(at);
}

/** Adds days to a YYYY-MM-DD date (pure calendar maths, no timezone drift). */
export function addDays(date: string, days: number): string {
   const d = new Date(`${date}T00:00:00Z`);
   d.setUTCDate(d.getUTCDate() + days);
   return d.toISOString().slice(0, 10);
}

/** Monday of the week containing the date. */
export function weekStart(date: string): string {
   const dow = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday
   return addDays(date, dow === 0 ? -6 : 1 - dow);
}

export function isIsoDate(value: unknown): value is string {
   return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** "пн, 17 нояб." for a YYYY-MM-DD date. */
export function formatDay(
   date: string,
   opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }
) {
   return new Intl.DateTimeFormat('ru-RU', { ...opts, timeZone: 'UTC' }).format(
      new Date(`${date}T00:00:00Z`)
   );
}
