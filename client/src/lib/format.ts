export const money = (n: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);

export const signedMoney = (n: number, currency = 'USD') => `${n > 0 ? '+' : n < 0 ? '-' : ''}${money(Math.abs(n), currency)}`;
export const signedR = (n: number) => `${n < 0 ? '-' : '+'}${Math.abs(n).toFixed(2)}R`;
export const pct = (n: number) => `${n.toFixed(1)}%`;

export const pnlColor = (n: number | undefined) => (n && n < 0 ? 'text-loss' : n && n > 0 ? 'text-profit' : 'text-ink-500');

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });

/** value for <input type="datetime-local"> */
export function toLocalInput(d: Date | string = new Date()): string {
  const date = new Date(d);
  const off = date.getTimezoneOffset() * 60_000;
  return new Date(+date - off).toISOString().slice(0, 16);
}

export const localDayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
