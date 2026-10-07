import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/Misc';
import { cn } from '@/lib/cn';
import { fmtDateTime, pnlColor, signedMoney, signedR } from '@/lib/format';
import type { Trade } from '@/types';
import { useTradeModal } from './TradeModalContext';

interface Props {
  trades: Trade[];
  currency: string;
  selectable?: boolean;
  selected?: Set<string>;
  onSelect?: (ids: Set<string>) => void;
  sort?: { key: string; order: 'asc' | 'desc' };
  onSort?: (key: string) => void;
}

const Side = ({ d }: { d: Trade['direction'] }) => <span className={cn('font-semibold capitalize', d === 'sell' ? 'text-loss' : 'text-profit')}>{d}</span>;
const Status = ({ s }: { s: Trade['status'] }) => <Badge tone={s === 'open' ? 'blue' : 'neutral'}>{s === 'open' ? 'Open' : 'Closed'}</Badge>;

export function TradeTable({ trades, currency, selectable, selected, onSelect, sort, onSort }: Props) {
  const { open } = useTradeModal();
  const all = trades.length > 0 && trades.every((t) => selected?.has(t._id));
  const toggle = (id: string) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    onSelect?.(n);
  };
  const SortBtn = ({ k, children, right }: { k: string; children: string; right?: boolean }) => (
    <button onClick={() => onSort?.(k)} className={cn('inline-flex items-center gap-1', right && 'ml-auto')}>
      {children}
      {sort?.key === k ? (sort.order === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : onSort ? <ArrowUpDown className="h-3 w-3 opacity-40" /> : null}
    </button>
  );

  return (
    <>
      {/* phones: card list */}
      <ul className="divide-y divide-ink-100 md:hidden">
        {trades.map((t) => (
          <li key={t._id} className="flex items-center gap-3 py-3">
            {selectable && <input type="checkbox" checked={selected?.has(t._id) ?? false} onChange={() => toggle(t._id)} className="h-4 w-4 accent-brand-500" aria-label="Select trade" />}
            <button onClick={() => open(t._id)} className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-semibold">{t.symbol} <Side d={t.direction} /></p>
                <p className="mt-0.5 truncate text-xs text-ink-500">{fmtDateTime(t.entryTime)}{t.session ? ` · ${t.session}` : ''}</p>
              </div>
              <div className="text-right">
                {t.status === 'open' ? <Status s="open" /> : (
                  <>
                    <p className={cn('font-semibold', pnlColor(t.netPnl))}>{signedMoney(t.netPnl ?? 0, currency)}</p>
                    <p className={cn('text-xs', pnlColor(t.rMultiple))}>{signedR(t.rMultiple)}</p>
                  </>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* tablet / desktop: table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs text-ink-500">
              {selectable && <th className="w-10 py-3 pl-1"><input type="checkbox" checked={all} onChange={() => onSelect?.(all ? new Set() : new Set(trades.map((t) => t._id)))} className="h-4 w-4 accent-brand-500" aria-label="Select all" /></th>}
              <th className="py-3 font-medium">{onSort ? <SortBtn k="symbol">Symbol</SortBtn> : 'Symbol'}</th>
              <th className="font-medium">Side</th><th className="font-medium">Status</th><th className="font-medium">Session</th>
              <th className="font-medium">{onSort ? <SortBtn k="entryTime">Entry</SortBtn> : 'Entry'}</th>
              <th className="text-right font-medium">{onSort ? <SortBtn k="rMultiple" right>R</SortBtn> : 'R'}</th>
              <th className="pr-2 text-right font-medium">{onSort ? <SortBtn k="netPnl" right>Net P&L</SortBtn> : 'Net P&L'}</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t._id} onClick={() => open(t._id)} className="cursor-pointer border-b border-ink-100 last:border-0 hover:bg-ink-50">
                {selectable && <td className="py-3.5 pl-1" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selected?.has(t._id) ?? false} onChange={() => toggle(t._id)} className="h-4 w-4 accent-brand-500" aria-label="Select trade" /></td>}
                <td className="py-3.5 font-semibold">{t.symbol}</td>
                <td><Side d={t.direction} /></td>
                <td><Status s={t.status} /></td>
                <td className="text-ink-500">{t.session ?? '—'}</td>
                <td className="text-ink-500">{fmtDateTime(t.entryTime)}</td>
                <td className={cn('text-right', pnlColor(t.rMultiple))}>{t.status === 'closed' ? signedR(t.rMultiple) : '—'}</td>
                <td className={cn('pr-2 text-right font-semibold', pnlColor(t.netPnl))}>{t.status === 'closed' ? signedMoney(t.netPnl ?? 0, currency) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
