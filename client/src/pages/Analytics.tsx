import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader, PageLoader, RangeTabs, StatCard, rangeLabel } from '@/components/ui/Misc';
import { RDistribution } from '@/components/charts/RDistribution';
import { BreakdownTable } from '@/components/dashboard/BreakdownTable';
import { useActiveAccount } from '@/context/AccountContext';
import { useAnalytics } from '@/hooks/queries';
import { pct, pnlColor, signedMoney, signedR } from '@/lib/format';
import type { Range } from '@/types';

export default function Analytics() {
  const { activeId, currency } = useActiveAccount();
  const [range, setRange] = useState<Range>('90d');
  const { data } = useAnalytics(activeId, range);
  if (!data) return <PageLoader />;
  const s = data.summary;
  const m = (n: number) => signedMoney(n, currency);

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle={rangeLabel(range)}
        actions={<><RangeTabs value={range} onChange={setRange} /><Button variant="secondary" onClick={() => window.print()} className="no-print"><FileDown className="h-4 w-4" /><span className="hidden sm:inline">Export PDF</span></Button></>}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Net P&L" value={m(s.netPnl)} tone={pnlColor(s.netPnl)} />
        <StatCard label="Win rate" value={pct(s.winRate)} sub={`${s.wins}W / ${s.losses}L`} />
        <StatCard label="Profit factor" value={s.profitFactor ?? '—'} />
        <StatCard label="Expectancy" value={m(s.expectancy)} tone={pnlColor(s.expectancy)} />
        <StatCard label="Avg R" value={signedR(s.avgR)} tone={pnlColor(s.avgR)} />
        <StatCard label="Closed trades" value={s.trades} />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <section className="card p-4 sm:p-5">
          <h3 className="font-semibold">R-multiple distribution</h3>
          <p className="mb-3 text-xs text-ink-500 sm:text-sm">{rangeLabel(range)}</p>
          <RDistribution data={data.rDistribution} />
        </section>
        <BreakdownTable title="By symbol" label="Symbol" rows={data.bySymbol} currency={currency} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownTable title="By session" label="Session" rows={data.bySession} currency={currency} />
        <BreakdownTable title="By setup" label="Setup" rows={data.bySetup} currency={currency} />
        <BreakdownTable title="By day of week" label="Day" rows={data.byDay} currency={currency} />
        <BreakdownTable title="By direction" label="Side" rows={data.byDirection} currency={currency} />
        <BreakdownTable title="By tag" label="Tag" rows={data.byTag} currency={currency} />
      </div>
    </>
  );
}
