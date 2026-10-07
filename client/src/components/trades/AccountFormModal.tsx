import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useSaveAccount } from '@/hooks/queries';
import { errorMessage } from '@/lib/api';
import type { Account } from '@/types';

const blank = { name: '', broker: '', startingBalance: '', currency: 'USD', daily: '3', risk: '1', maxTrades: '5' };

export function AccountFormModal({ open, account, onClose }: { open: boolean; account?: Account; onClose: () => void }) {
  const save = useSaveAccount();
  const [f, setF] = useState(blank);

  useEffect(() => {
    if (!open) return;
    setF(account ? {
      name: account.name, broker: account.broker, startingBalance: String(account.startingBalance), currency: account.currency,
      daily: String(account.settings.dailyLossLimitPct), risk: String(account.settings.riskPerTradePct), maxTrades: String(account.settings.maxTradesPerDay),
    } : blank);
  }, [open, account]);

  const submit = async () => {
    if (!f.name.trim()) return toast.error('Give the account a name');
    try {
      await save.mutateAsync({
        id: account?._id,
        data: {
          name: f.name, broker: f.broker, currency: f.currency.toUpperCase(), startingBalance: Number(f.startingBalance) || 0,
          settings: { dailyLossLimitPct: Number(f.daily), riskPerTradePct: Number(f.risk), maxTradesPerDay: Number(f.maxTrades) },
        },
      });
      toast.success('Account saved');
      onClose();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const bind = (k: keyof typeof blank) => ({ value: f[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value }) });

  return (
    <Modal open={open} onClose={onClose} title={account ? 'Edit account' : 'Add account'} subtitle="Each account keeps its own balance and equity curve."
      footer={<><span /><Button onClick={submit} loading={save.isPending}>Save account</Button></>}>
      <div className="space-y-4">
        <Field label="Account name"><Input placeholder="Live – ICMarkets" {...bind('name')} /></Field>
        <Field label="Broker"><Input placeholder="Optional" {...bind('broker')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starting balance"><Input type="number" inputMode="decimal" min={0} step="any" {...bind('startingBalance')} /></Field>
          <Field label="Currency"><Input maxLength={3} {...bind('currency')} /></Field>
        </div>
        <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-ink-500">Risk guardrails</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Daily loss %"><Input type="number" step="any" {...bind('daily')} /></Field>
          <Field label="Risk / trade %"><Input type="number" step="any" {...bind('risk')} /></Field>
          <Field label="Max trades / day"><Input type="number" {...bind('maxTrades')} /></Field>
        </div>
      </div>
    </Modal>
  );
}
