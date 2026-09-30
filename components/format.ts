const eur = new Intl.NumberFormat('en-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const eurCents = new Intl.NumberFormat('en-BE', { style: 'currency', currency: 'EUR' });

/** Format integer EUR cents. Whole euros drop the decimals. */
export function formatCents(cents: number): string {
  return cents % 100 === 0 ? eur.format(cents / 100) : eurCents.format(cents / 100);
}

const longDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const monthYear = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Accepts `YYYY-MM-DD` or an ISO instant; renders in UTC so the fixed demo clock never shifts. */
export function formatDate(iso: string): string {
  return longDate.format(new Date(iso.length === 10 ? `${iso}T00:00:00.000Z` : iso));
}

export function formatMonth(iso: string): string {
  return monthYear.format(new Date(iso.length === 10 ? `${iso}T00:00:00.000Z` : iso));
}
