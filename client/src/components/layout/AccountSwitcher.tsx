import { Layers } from 'lucide-react';
import { useActiveAccount } from '@/context/AccountContext';
import { cn } from '@/lib/cn';

/** compact = icon-only look used by the tablet rail */
export function AccountSwitcher({ className }: { className?: string }) {
  const { accounts, activeId, setActiveId } = useActiveAccount();
  return (
    <div className={cn('relative rounded-2xl border border-ink-200 bg-white px-3 py-2.5', className)}>
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-500"><Layers className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-ink-500">Active account</p>
          <select
            value={activeId}
            onChange={(e) => setActiveId(e.target.value)}
            className="w-full cursor-pointer truncate bg-transparent text-sm font-semibold outline-none"
            aria-label="Active account"
          >
            <option value="all">All accounts</option>
            {accounts.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
