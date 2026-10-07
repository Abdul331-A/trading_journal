import { cn } from '@/lib/cn';
import { pct, pnlColor, signedMoney, signedR } from '@/lib/format';
import type { Row } from '@/types';

export function BreakdownTable({ title, label, rows, currency }: { title: string; label: string; rows: Row[]; currency: string }) {
  return (
    <div className="card p-4 sm:p-5">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-400">No data yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-500">
                <th className="py-2 font-medium">{label}</th><th className="text-right font-medium">Trades</th>
                <th className="text-right font-medium">Win %</th><th className="text-right font-medium">Avg R</th><th className="text-right font-medium">Net P&L</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-ink-100 last:border-0">
                  <td className="py-2.5 font-medium">{r.key}</td>
                  <td className="text-right">{r.trades}</td>
                  <td className="text-right">{pct(r.winRate)}</td>
                  <td className={cn('text-right', pnlColor(r.avgR))}>{signedR(r.avgR)}</td>
                  <td className={cn('text-right font-semibold', pnlColor(r.netPnl))}>{signedMoney(r.netPnl, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
