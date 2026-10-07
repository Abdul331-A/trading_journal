import { useState } from 'react';
import { Activity, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState, PageHeader, PageLoader, RangeTabs, StatCard, rangeLabel } from '@/components/ui/Misc';
import { EquityCurve } from '@/components/charts/EquityCurve';
import { PnlCalendar } from '@/components/calendar/PnlCalendar';
import { Guardrails } from '@/components/dashboard/Guardrails';
import { TradeTable } from '@/components/trades/TradeTable';
import { useTradeModal } from '@/components/trades/TradeModalContext';
import { useActiveAccount } from '@/context/AccountContext';
import { useAnalytics, useTrades } from '@/hooks/queries';
import { cn } from '@/lib/cn';
import { money, pct, pnlColor, signedMoney, signedR } from '@/lib/format';
import type { Range } from '@/types';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { activeId, currency } = useActiveAccount();
  const { open } = useTradeModal();
  const [range, setRange] = useState<Range>('90d');
  const { data, isLoading } = useAnalytics(activeId, range);
  const recent = useTrades(activeId, { limit: 5 });
  const openTrades = useTrades(activeId, { status: 'open', limit: 20 });

  if (isLoading || !data) return <PageLoader />;
  const s = data.summary;
  const hasStart = data.startingBalance > 0;
  const m = (n: number) => signedMoney(n, currency);

  return (
    <>
      <PageHeader
        title="Trading journal"
        subtitle="Log every trade and find your edge. Private to you."
        actions={<><RangeTabs value={range} onChange={setRange} /><Button onClick={() => open()} className="hidden md:inline-flex"><Plus className="h-4 w-4" /> Log trade</Button></>}
      />

      <section className="card mb-4 p-4 sm:p-5">
        <h2 className="font-semibold">Account performance</h2>
        <p className="mb-4 text-xs text-ink-500 sm:text-sm">{rangeLabel(range)}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="Starting balance" value={money(data.startingBalance, currency)} />
          <Metric label="Current balance" value={money(data.currentBalance, currency)} />
          <Metric label="Net P&L" value={m(s.netPnl)} tone={pnlColor(s.netPnl)} />
          <Metric label="Growth" value={hasStart ? pct((s.netPnl / data.startingBalance) * 100) : '—'} />
          <Metric label="Win rate" value={pct(s.winRate)} sub={`${s.wins}W / ${s.losses}L`} />
          <Metric label="Closed trades" value={String(s.trades)} />
        </div>
        {!hasStart && (
          <p className="mt-4 border-t border-ink-100 pt-3 text-sm text-ink-500">
            Set a starting balance on this account to see growth and return percentages.{' '}
            <Link className="font-medium text-brand-600" to="/accounts">Open accounts</Link>
          </p>
        )}
      </section>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Net P&L" value={m(s.netPnl)} tone={pnlColor(s.netPnl)} />
        <StatCard label="Win rate" value={pct(s.winRate)} sub={`${s.wins}W / ${s.losses}L`} />
        <StatCard label="Profit factor" value={s.profitFactor ?? '—'} tone={s.profitFactor == null ? 'text-loss' : undefined} />
        <StatCard label="Expectancy" value={m(s.expectancy)} tone={pnlColor(s.expectancy)} />
        <StatCard label="Avg R" value={signedR(s.avgR)} tone={pnlColor(s.avgR)} />
        <StatCard label="Closed trades" value={s.trades} />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <section className="card p-4 sm:p-5">
          <h3 className="font-semibold">Equity curve</h3>
          <p className="mb-3 text-xs text-ink-500 sm:text-sm">{rangeLabel(range)}</p>
          {data.equity.length > 1 ? <EquityCurve data={data.equity} currency={currency} /> : <EmptyState icon={<Activity className="h-5 w-5" />} title="No closed trades yet" text="Your equity curve draws itself as you log trades." />}
        </section>
        <PnlCalendar compact />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Best trade" value={m(s.best)} tone="text-profit" />
        <StatCard label="Worst trade" value={m(s.worst)} tone="text-loss" />
        <StatCard label="Max drawdown" value={m(-s.maxDrawdown)} sub={pct(s.maxDrawdownPct)} tone={s.maxDrawdown ? 'text-loss' : undefined} />
        <StatCard label="Longest win streak" value={s.longestWinStreak} tone="text-profit" />
        <StatCard label="Longest loss streak" value={s.longestLossStreak} tone="text-loss" />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-5">
        <section className="card p-4 sm:p-5 lg:col-span-3">
          <h3 className="font-semibold">Open positions</h3>
          <p className="mb-2 text-xs text-ink-500 sm:text-sm">{openTrades.data?.total ? `${openTrades.data.total} open now` : 'Nothing open right now'}</p>
          {openTrades.data?.trades.length ? <TradeTable trades={openTrades.data.trades} currency={currency} /> : (
            <EmptyState icon={<Activity className="h-5 w-5" />} title="No open positions" text="Trades you log without an exit show up here until you close them." />
          )}
        </section>
        <div className="lg:col-span-2"><Guardrails /></div>
      </div>

      <section className="card p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">Recent trades</h3>
          <Link to="/trades" className="text-sm font-medium text-brand-600">View all</Link>
        </div>
        {recent.data?.trades.length ? <TradeTable trades={recent.data.trades} currency={currency} /> : <p className="py-6 text-center text-sm text-ink-400">No trades yet. Hit “Log trade” to add your first.</p>}
      </section>
    </>
  );
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className={cn('mt-1 text-lg font-bold sm:text-xl', tone)}>{value}</p>
      {sub && <p className="text-xs text-ink-400">{sub}</p>}
    </div>
  );
}
