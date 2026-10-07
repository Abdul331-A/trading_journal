import { useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge, PageHeader } from '@/components/ui/Misc';
import { AccountFormModal } from '@/components/trades/AccountFormModal';
import { useActiveAccount } from '@/context/AccountContext';
import { useDeleteAccount, useSaveAccount } from '@/hooks/queries';
import { errorMessage } from '@/lib/api';
import { money } from '@/lib/format';
import type { Account } from '@/types';

export default function Accounts() {
  const { accounts, setActiveId } = useActiveAccount();
  const del = useDeleteAccount();
  const save = useSaveAccount();
  const [modal, setModal] = useState<{ open: boolean; account?: Account }>({ open: false });

  const remove = async (a: Account) => {
    if (!window.confirm(`Delete "${a.name}" and ALL its trades? This cannot be undone.`)) return;
    try { await del.mutateAsync(a._id); toast.success('Account deleted'); } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <>
      <PageHeader title="Accounts" subtitle="Each account keeps its own starting balance, currency and equity curve."
        actions={<Button onClick={() => setModal({ open: true })}><Plus className="h-4 w-4" /> Add account</Button>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {accounts.map((a) => (
          <div key={a._id} className="card p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-lg font-semibold">{a.name}</h3>
                  {a.isDefault && <Badge tone="blue">Default</Badge>}
                </div>
                <p className="text-sm text-ink-500">{a.broker || 'No broker set'}</p>
              </div>
              <div className="flex shrink-0">
                {!a.isDefault && <button aria-label="Make default" title="Make default" onClick={() => save.mutate({ id: a._id, data: { isDefault: true } })} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100"><Star className="h-4 w-4" /></button>}
                <button aria-label="Edit" onClick={() => setModal({ open: true, account: a })} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100"><Pencil className="h-4 w-4" /></button>
                {accounts.length > 1 && <button aria-label="Delete" onClick={() => remove(a)} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100"><Trash2 className="h-4 w-4" /></button>}
              </div>
            </div>
            <div className="my-4 grid grid-cols-2 gap-4 border-y border-ink-100 py-4">
              <div><p className="text-xs text-ink-500">Starting balance</p><p className="mt-1 font-bold">{money(a.startingBalance, a.currency)}</p></div>
              <div><p className="text-xs text-ink-500">Currency</p><p className="mt-1 font-bold">{a.currency}</p></div>
            </div>
            <Button variant="secondary" className="w-full" onClick={() => setActiveId(a._id)}>View this account</Button>
          </div>
        ))}
      </div>

      <AccountFormModal open={modal.open} account={modal.account} onClose={() => setModal({ open: false })} />
    </>
  );
}
