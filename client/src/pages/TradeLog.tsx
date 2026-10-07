import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, List, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { EmptyState, PageHeader, Spinner } from '@/components/ui/Misc';
import { TradeTable } from '@/components/trades/TradeTable';
import { useTradeModal } from '@/components/trades/TradeModalContext';
import { useActiveAccount } from '@/context/AccountContext';
import { useDeleteTrades, useFilterOptions, useTrades } from '@/hooks/queries';
import { api, errorMessage } from '@/lib/api';
import type { TradeFilters } from '@/types';

export default function TradeLog() {
  const { activeId, currency } = useActiveAccount();
  const { open } = useTradeModal();
  const [f, setF] = useState<TradeFilters>({ sort: 'entryTime', order: 'desc', page: 1, limit: 25 });
  const [symbol, setSymbol] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { data, isFetching } = useTrades(activeId, f);
  const options = useFilterOptions(activeId);
  const del = useDeleteTrades();

  // debounce symbol search
  useEffect(() => {
    const t = setTimeout(() => setF((p) => ({ ...p, symbol: symbol || undefined, page: 1 })), 300);
    return () => clearTimeout(t);
  }, [symbol]);
  useEffect(() => setSelected(new Set()), [activeId, f]);

  const set = (patch: Partial<TradeFilters>) => setF((p) => ({ ...p, ...patch, page: 1 }));
  const onSort = (key: string) =>
    setF((p) => ({ ...p, sort: key, order: p.sort === key && p.order === 'desc' ? 'asc' : 'desc', page: 1 }));

  const exportCsv = async () => {
    try {
      const { data: blob } = await api.get('/trades/export', { params: { account: activeId }, responseType: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'trades.csv';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.size} trade(s)? This cannot be undone.`)) return;
    try { await del.mutateAsync([...selected]); setSelected(new Set()); toast.success('Deleted'); } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <>
      <PageHeader
        title="Trade log"
        subtitle={data ? `${data.total} trade${data.total === 1 ? '' : 's'}` : ' '}
        actions={<><Button variant="secondary" onClick={exportCsv}><Download className="h-4 w-4" /><span className="hidden sm:inline">Export CSV</span></Button><Button onClick={() => open()} className="hidden md:inline-flex"><Plus className="h-4 w-4" /> Log trade</Button></>}
      />

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Select value={f.status ?? ''} onChange={(e) => set({ status: e.target.value || undefined })}><option value="">All statuses</option><option value="open">Open</option><option value="closed">Closed</option></Select>
        <Select value={f.direction ?? ''} onChange={(e) => set({ direction: e.target.value || undefined })}><option value="">Buy and sell</option><option value="buy">Buy</option><option value="sell">Sell</option></Select>
        <Select value={f.session ?? ''} onChange={(e) => set({ session: e.target.value || undefined })}><option value="">All sessions</option>{['Sydney', 'Tokyo', 'London', 'New York'].map((x) => <option key={x}>{x}</option>)}</Select>
        <Select value={f.setup ?? ''} onChange={(e) => set({ setup: e.target.value || undefined })}><option value="">All setups</option>{options.data?.setups.map((x) => <option key={x}>{x}</option>)}</Select>
        <Select value={f.tag ?? ''} onChange={(e) => set({ tag: e.target.value || undefined })}><option value="">All tags</option>{options.data?.tags.map((x) => <option key={x}>{x}</option>)}</Select>
        <Input placeholder="Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        <Input type="date" aria-label="From date" onChange={(e) => set({ from: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
        <Input type="date" aria-label="To date" onChange={(e) => set({ to: e.target.value ? new Date(`${e.target.value}T23:59:59`).toISOString() : undefined })} />
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-2.5 text-sm">
          <span className="font-medium text-brand-700">{selected.size} selected</span>
          <Button variant="danger" size="sm" onClick={bulkDelete} loading={del.isPending}><Trash2 className="h-4 w-4" /> Delete</Button>
        </div>
      )}

      <section className="card px-4 sm:px-5">
        {!data ? <div className="grid place-items-center py-16"><Spinner /></div> : data.trades.length === 0 ? (
          <EmptyState icon={<List className="h-5 w-5" />} title="No trades found" text="Try clearing filters, or log your first trade." action={<Button onClick={() => open()}><Plus className="h-4 w-4" /> Log trade</Button>} />
        ) : (
          <TradeTable trades={data.trades} currency={currency} selectable selected={selected} onSelect={setSelected} sort={{ key: f.sort ?? 'entryTime', order: f.order ?? 'desc' }} onSort={onSort} />
        )}
      </section>

      {data && data.pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <Button variant="secondary" size="sm" disabled={data.page <= 1 || isFetching} onClick={() => setF((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}>Previous</Button>
          <span className="text-sm text-ink-500">Page {data.page} of {data.pages}</span>
          <Button variant="secondary" size="sm" disabled={data.page >= data.pages || isFetching} onClick={() => setF((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}>Next</Button>
        </div>
      )}
    </>
  );
}
