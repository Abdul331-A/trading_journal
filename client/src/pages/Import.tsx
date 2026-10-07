import { DragEvent, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { UploadCloud } from 'lucide-react';
import { Field, Select } from '@/components/ui/Field';
import { PageHeader, Spinner } from '@/components/ui/Misc';
import { useActiveAccount } from '@/context/AccountContext';
import { useImportTrades } from '@/hooks/queries';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';

export default function Import() {
  const { accounts, active, defaultAccount } = useActiveAccount();
  const [target, setTarget] = useState(active?._id ?? defaultAccount?._id ?? '');
  const [drag, setDrag] = useState(false);
  const [result, setResult] = useState<{ imported: number; duplicates: number; skipped: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const run = useImportTrades();

  const handle = async (file?: File) => {
    if (!file) return;
    setResult(null);
    try {
      const r = await run.mutateAsync({ file, account: target || accounts[0]?._id });
      setResult(r);
      toast.success(`Imported ${r.imported} trade${r.imported === 1 ? '' : 's'}`);
    } catch (e) { toast.error(errorMessage(e)); }
    if (input.current) input.current.value = '';
  };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); };

  return (
    <>
      <PageHeader title="Import trades" subtitle="Upload the CSV your terminal exports. We detect columns and skip anything already imported." />
      <div className="max-w-2xl space-y-4">
        <Field label="Import into account">
          <Select value={target} onChange={(e) => setTarget(e.target.value)}>{accounts.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}</Select>
        </Field>
        <button type="button" onClick={() => input.current?.click()} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop}
          className={cn('card flex w-full flex-col items-center gap-2 px-6 py-14 text-center transition', drag && 'border-brand-500 bg-brand-50')}>
          {run.isPending ? <Spinner className="h-8 w-8" /> : <UploadCloud className="h-8 w-8 text-ink-700" />}
          <span className="font-medium">Drop a file here, or tap to choose one</span>
          <span className="text-sm text-ink-500">CSV from MT4 / MT5 history or your broker</span>
        </button>
        <input ref={input} type="file" accept=".csv,text/csv" hidden onChange={(e) => handle(e.target.files?.[0])} />
        {result && (
          <div className="card p-4 text-sm">
            <p className="font-semibold text-profit">{result.imported} imported</p>
            <p className="text-ink-500">{result.duplicates} already existed · {result.skipped} rows skipped</p>
          </div>
        )}
        <div className="rounded-2xl bg-ink-100/70 p-4 text-sm text-ink-500">
          <p className="mb-1 font-medium text-ink-700">Expected columns</p>
          Symbol, Type (buy/sell), Volume, Open Time, Open Price, Close Price, Profit — plus optional S/L, T/P, Commission, Swap, Ticket. Times are read as UTC.
        </div>
      </div>
    </>
  );
}
