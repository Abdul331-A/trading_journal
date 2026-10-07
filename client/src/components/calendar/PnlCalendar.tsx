import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useActiveAccount } from '@/context/AccountContext';
import { useCalendar } from '@/hooks/queries';
import { cn } from '@/lib/cn';
import { localDayKey, signedMoney } from '@/lib/format';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** compact: dashboard version, no week column */
export function PnlCalendar({ compact = false }: { compact?: boolean }) {
  const { activeId, currency } = useActiveAccount();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const month = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
  const { data } = useCalendar(activeId, month);

  const first = cursor.getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  const todayKey = localDayKey(new Date());
  const shift = (n: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));
  const key = (day: number) => `${month}-${String(day).padStart(2, '0')}`;

  const short = (n: number) => (compact || window.innerWidth < 640 ? `${n > 0 ? '+' : n < 0 ? '-' : ''}${Math.abs(Math.round(n))}` : signedMoney(n, currency));
  const total = data?.total ?? 0;

  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">P&L calendar</h3>
          <p className="text-xs text-ink-500 sm:text-sm">{data?.trades ?? 0} trade{data?.trades === 1 ? '' : 's'} this month</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <span className={cn('text-sm font-semibold sm:text-base', total > 0 ? 'text-profit' : total < 0 ? 'text-loss' : 'text-ink-400')}>{signedMoney(total, currency)}</span>
          <button onClick={() => shift(-1)} aria-label="Previous month" className="rounded-lg p-1.5 hover:bg-ink-100"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-[7.5rem] text-center text-sm font-medium">{cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => shift(1)} aria-label="Next month" className="rounded-lg p-1.5 hover:bg-ink-100"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      <div className={cn('grid gap-1 sm:gap-1.5', compact ? 'grid-cols-7' : 'grid-cols-7 md:grid-cols-8')}>
        {DOW.map((d) => <div key={d} className="py-1 text-center text-[10px] font-medium uppercase tracking-wide text-ink-500 sm:text-xs">{compact ? d.slice(0, 3) : d}</div>)}
        {!compact && <div className="hidden py-1 text-center text-xs font-medium uppercase tracking-wide text-ink-500 md:block">Week</div>}

        {weeks.map((w, wi) => {
          const weekTotal = w.reduce<number>((s, d) => s + (d ? data?.days[key(d)]?.pnl ?? 0 : 0), 0);
          const weekHas = w.some((d) => d && data?.days[key(d)]);
          return [
            ...w.map((d, di) => {
              if (!d) return <div key={`e${wi}${di}`} />;
              const day = data?.days[key(d)];
              const isToday = key(d) === todayKey;
              return (
                <div key={d} className={cn('flex aspect-square flex-col rounded-lg border p-1 text-[10px] sm:aspect-auto sm:min-h-[4.5rem] sm:rounded-xl sm:p-2 sm:text-xs',
                  day ? (day.pnl >= 0 ? 'border-profit/20 bg-emerald-50' : 'border-loss/20 bg-red-50') : 'border-transparent bg-ink-50',
                  isToday && 'ring-2 ring-brand-500')}>
                  <span className={cn('text-ink-500', isToday && 'font-bold text-brand-600')}>{d}</span>
                  {day && <span className={cn('mt-auto truncate text-[10px] font-semibold sm:mt-1 sm:text-xs', day.pnl >= 0 ? 'text-profit' : 'text-loss')}>{short(day.pnl)}</span>}
                </div>
              );
            }),
            !compact && (
              <div key={`w${wi}`} className="hidden items-center justify-center rounded-xl bg-ink-50 text-xs font-semibold md:flex">
                {weekHas ? <span className={weekTotal >= 0 ? 'text-profit' : 'text-loss'}>{signedMoney(weekTotal, currency)}</span> : <span className="text-ink-400">—</span>}
              </div>
            ),
          ];
        })}
      </div>
    </div>
  );
}
