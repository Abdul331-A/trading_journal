import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/Misc';
import { useActiveAccount } from '@/context/AccountContext';
import { useGuardrails } from '@/hooks/queries';

const tone = { safe: 'green', warn: 'amber', over: 'red', unset: 'neutral' } as const;
const label = { safe: 'Safe', warn: 'Close', over: 'Over', unset: 'Off' } as const;

export function Guardrails() {
  const { activeId } = useActiveAccount();
  const { data } = useGuardrails(activeId);
  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="font-semibold">Risk guardrails</h3>
          <p className="text-xs text-ink-500 sm:text-sm">Today, against your limits</p>
        </div>
        {data?.limitHit && <Badge tone="red">Limit hit</Badge>}
      </div>
      <div className="space-y-2.5">
        {data?.items.map((i) => (
          <div key={i.key} className="flex items-start gap-3 rounded-xl bg-ink-50 p-3">
            {i.status === 'over' ? <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-loss" /> : <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-profit" />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{i.label}</p>
              <p className="text-xs text-ink-500">{i.message}</p>
            </div>
            <Badge tone={tone[i.status]}>{label[i.status]}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
