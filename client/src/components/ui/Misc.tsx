import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Range } from '@/types';

export const Spinner = ({ className }: { className?: string }) => <Loader2 className={cn('h-5 w-5 animate-spin text-ink-400', className)} />;

export const PageLoader = () => (
  <div className="flex h-[60dvh] items-center justify-center"><Spinner className="h-7 w-7" /></div>
);

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'green' | 'red' | 'amber' | 'blue' }) {
  const tones = {
    neutral: 'bg-ink-100 text-ink-500',
    green: 'bg-emerald-50 text-profit',
    red: 'bg-red-50 text-loss',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-brand-50 text-brand-600',
  };
  return <span className={cn('inline-flex rounded-md px-2 py-0.5 text-xs font-medium', tones[tone])}>{children}</span>;
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-500">{icon}</div>
      <p className="font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-ink-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3 sm:mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500 sm:text-base">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: string; tone?: string }) {
  return (
    <div className="card p-4 sm:p-5">
      <p className="text-xs text-ink-500 sm:text-sm">{label}</p>
      <p className={cn('mt-1.5 text-xl font-bold tracking-tight sm:text-2xl', tone)}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-400">{sub}</p>}
    </div>
  );
}

const RANGES: { id: Range; label: string }[] = [
  { id: '7d', label: '7D' }, { id: '30d', label: '30D' }, { id: '90d', label: '90D' }, { id: '1y', label: '1Y' }, { id: 'all', label: 'All' },
];

export function RangeTabs({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div className="no-print inline-flex rounded-xl bg-ink-100 p-1">
      {RANGES.map((r) => (
        <button
          key={r.id}
          onClick={() => onChange(r.id)}
          className={cn('rounded-lg px-2.5 py-1.5 text-xs font-medium transition sm:px-3 sm:text-sm', value === r.id ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500')}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

export const rangeLabel = (r: Range) => (r === 'all' ? 'All time' : r === '1y' ? 'Last year' : `Last ${r.replace('d', '')} days`);
