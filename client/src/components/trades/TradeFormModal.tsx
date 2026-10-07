import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ImagePlus, Trash2, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Misc';
import { useActiveAccount } from '@/context/AccountContext';
import { useDeleteTrades, useSaveTrade } from '@/hooks/queries';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { toLocalInput } from '@/lib/format';
import type { Screenshot, Trade } from '@/types';

type Section = 'setup' | 'tags' | 'emotion' | 'notes' | 'costs' | 'risk' | 'review';
const SECTIONS: { id: Section; label: string }[] = [
  { id: 'setup', label: 'Setup' }, { id: 'tags', label: 'Tags' }, { id: 'emotion', label: 'Emotion' },
  { id: 'notes', label: 'Notes' }, { id: 'costs', label: 'Costs' }, { id: 'risk', label: 'Risk' }, { id: 'review', label: 'Review' },
];

interface FormState {
  entryTime: string; exitTime: string; symbol: string; direction: 'buy' | 'sell'; lotSize: string;
  entryPrice: string; exitPrice: string; stopLoss: string; takeProfit: string; netPnl: string;
  setup: string; tags: string[]; emotionBefore: string; emotionAfter: string;
  followedPlan: 'yes' | 'no' | 'unrecorded'; mistakes: string; notes: string;
  commission: string; swap: string; fees: string; riskAmount: string;
  confidence: string; selfGrade: string; lessons: string; screenshots: Screenshot[];
}

const blank = (): FormState => ({
  entryTime: toLocalInput(), exitTime: '', symbol: '', direction: 'buy', lotSize: '', entryPrice: '', exitPrice: '',
  stopLoss: '', takeProfit: '', netPnl: '', setup: '', tags: [], emotionBefore: '', emotionAfter: '',
  followedPlan: 'unrecorded', mistakes: '', notes: '', commission: '', swap: '', fees: '', riskAmount: '',
  confidence: '', selfGrade: '', lessons: '', screenshots: [],
});

const s = (n: number | undefined) => (n == null ? '' : String(n));
const fromTrade = (t: Trade): FormState => ({
  entryTime: toLocalInput(t.entryTime), exitTime: t.exitTime ? toLocalInput(t.exitTime) : '', symbol: t.symbol,
  direction: t.direction, lotSize: s(t.lotSize), entryPrice: s(t.entryPrice), exitPrice: s(t.exitPrice),
  stopLoss: s(t.stopLoss), takeProfit: s(t.takeProfit), netPnl: s(t.netPnl), setup: t.setup, tags: t.tags,
  emotionBefore: t.emotionBefore, emotionAfter: t.emotionAfter, followedPlan: t.followedPlan, mistakes: t.mistakes,
  notes: t.notes, commission: s(t.commission), swap: s(t.swap), fees: s(t.fees), riskAmount: s(t.riskAmount),
  confidence: s(t.confidence), selfGrade: s(t.selfGrade), lessons: t.lessons, screenshots: t.screenshots ?? [],
});

/** which optional sections have data (so edit mode opens them) */
const filledSections = (f: FormState): Section[] => {
  const out: Section[] = [];
  if (f.setup) out.push('setup');
  if (f.tags.length) out.push('tags');
  if (f.emotionBefore || f.emotionAfter || f.followedPlan !== 'unrecorded' || f.mistakes) out.push('emotion');
  if (f.notes || f.screenshots.length) out.push('notes');
  if (f.commission || f.swap || f.fees) out.push('costs');
  if (f.riskAmount) out.push('risk');
  if (f.confidence || f.selfGrade || f.lessons) out.push('review');
  return out;
};

interface Props { open: boolean; tradeId?: string; onClose: () => void }

export function TradeFormModal({ open, tradeId, onClose }: Props) {
  const { activeId, defaultAccount } = useActiveAccount();
  const save = useSaveTrade();
  const del = useDeleteTrades();
  const [form, setForm] = useState<FormState>(blank);
  const [sections, setSections] = useState<Section[]>([]);
  const [another, setAnother] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [accountId, setAccountId] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const existing = useQuery({
    queryKey: ['trade', tradeId],
    enabled: open && Boolean(tradeId),
    queryFn: async () => (await api.get<{ trade: Trade }>(`/trades/${tradeId}`)).data.trade,
  });

  useEffect(() => {
    if (!open) return;
    if (!tradeId) {
      setForm(blank());
      setSections([]);
      setAccountId(activeId !== 'all' ? activeId : defaultAccount?._id ?? '');
    }
  }, [open, tradeId, activeId, defaultAccount?._id]);

  useEffect(() => {
    if (existing.data) {
      const f = fromTrade(existing.data);
      setForm(f);
      setSections(filledSections(f));
      setAccountId(typeof existing.data.account === 'string' ? existing.data.account : existing.data.account._id);
    }
  }, [existing.data]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const bind = (k: keyof FormState) => ({
    value: form[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value as never),
  });
  const toggle = (id: Section) => setSections((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const has = (id: Section) => sections.includes(id);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t]);
    setTagInput('');
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, 6 - form.screenshots.length)) {
        const fd = new FormData();
        fd.append('image', file);
        const { data } = await api.post<Screenshot>('/uploads/screenshot', fd);
        setForm((f) => ({ ...f, screenshots: [...f.screenshots, data] }));
      }
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = async () => {
    if (!form.symbol.trim()) return toast.error('Symbol required');
    if (!Number(form.lotSize) || Number(form.lotSize) <= 0) return toast.error('Enter a lot size above 0');
    if (!accountId) return toast.error('No account found');
    const data: Record<string, unknown> = { ...form, account: accountId, entryTime: new Date(form.entryTime).toISOString() };
    data.exitTime = form.exitTime ? new Date(form.exitTime).toISOString() : '';
    try {
      await save.mutateAsync({ id: tradeId, data });
      toast.success(tradeId ? 'Trade updated' : 'Trade saved');
      if (another && !tradeId) { setForm(blank()); setSections([]); } else onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const remove = async () => {
    if (!tradeId || !window.confirm('Delete this trade? This cannot be undone.')) return;
    try { await del.mutateAsync([tradeId]); toast.success('Trade deleted'); onClose(); } catch (e) { toast.error(errorMessage(e)); }
  };

  const loading = Boolean(tradeId) && existing.isLoading;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tradeId ? 'Edit trade' : 'Log a trade'}
      subtitle="The essentials. Everything else is optional."
      footer={
        <>
          {tradeId ? (
            <Button variant="ghost" size="sm" onClick={remove} className="text-loss"><Trash2 className="h-4 w-4" /> Delete</Button>
          ) : (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-500">
              <input type="checkbox" checked={another} onChange={(e) => setAnother(e.target.checked)} className="h-4 w-4 rounded accent-brand-500" />
              Log another
            </label>
          )}
          <Button onClick={submit} loading={save.isPending} disabled={loading}>Save trade</Button>
        </>
      }
    >
      {loading ? <div className="grid place-items-center py-16"><Spinner /></div> : (
        <div className="space-y-4">
          <Field label="Trade date and time"><Input type="datetime-local" {...bind('entryTime')} /></Field>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Symbol" className="col-span-2 sm:col-span-1"><Input placeholder="EURUSD" autoCapitalize="characters" {...bind('symbol')} /></Field>
            <Field label="Direction">
              <Select {...bind('direction')}><option value="buy">Buy</option><option value="sell">Sell</option></Select>
            </Field>
            <Field label="Lot size"><Input type="number" inputMode="decimal" step="any" placeholder="1.0" {...bind('lotSize')} /></Field>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-ink-100 bg-ink-50/70 p-3">
            <Field label="Entry price"><Input type="number" inputMode="decimal" step="any" {...bind('entryPrice')} /></Field>
            <Field label="Exit price"><Input type="number" inputMode="decimal" step="any" {...bind('exitPrice')} /></Field>
            <Field label="Stop loss (sets your R)"><Input type="number" inputMode="decimal" step="any" placeholder="Optional" {...bind('stopLoss')} /></Field>
            <Field label="Take profit"><Input type="number" inputMode="decimal" step="any" placeholder="Optional" {...bind('takeProfit')} /></Field>
          </div>

          <Field label="Net P&L (USD)" hint="Leave empty to log a position that is still open.">
            <Input type="number" inputMode="decimal" step="any" placeholder="0.00" {...bind('netPnl')} />
          </Field>

          <div className="flex flex-wrap gap-2">
            {SECTIONS.map(({ id, label }) => (
              <button key={id} type="button" onClick={() => toggle(id)}
                className={cn('inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                  has(id) ? 'border-brand-500/30 bg-brand-50 text-brand-600' : 'border-ink-200 text-ink-500 hover:bg-ink-50')}>
                {has(id) ? <X className="h-3 w-3" /> : '+'} {label}
              </button>
            ))}
          </div>

          {has('setup') && <Field label="Setup or strategy"><Input placeholder="Breakout, pullback, range" {...bind('setup')} /></Field>}

          {has('tags') && (
            <Field label="Tags">
              <div className="field flex flex-wrap items-center gap-1.5 !py-2">
                {form.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs text-brand-600">
                    {t}<button type="button" aria-label={`Remove ${t}`} onClick={() => set('tags', form.tags.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onBlur={addTag}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
                  placeholder="Add and press Enter" className="min-w-[8rem] flex-1 bg-transparent outline-none" />
              </div>
            </Field>
          )}

          {has('emotion') && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Before the trade"><Input placeholder="Calm, FOMO, anxious" {...bind('emotionBefore')} /></Field>
              <Field label="After the trade"><Input {...bind('emotionAfter')} /></Field>
              <Field label="Followed your plan?">
                <Select {...bind('followedPlan')}><option value="unrecorded">Not recorded</option><option value="yes">Yes</option><option value="no">No</option></Select>
              </Field>
              <Field label="Mistakes"><Input placeholder="Early entry" {...bind('mistakes')} /></Field>
            </div>
          )}

          {has('notes') && (
            <>
              <Field label="Notes"><Textarea {...bind('notes')} /></Field>
              <div>
                <span className="label">Screenshots</span>
                <div className="flex flex-wrap gap-2">
                  {form.screenshots.map((img) => (
                    <div key={img.publicId} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-ink-200">
                      <a href={img.url} target="_blank" rel="noreferrer"><img src={img.url.replace('/upload/', '/upload/c_fill,w_160,h_160/')} alt="Trade screenshot" className="h-full w-full object-cover" /></a>
                      <button type="button" aria-label="Remove screenshot" onClick={() => set('screenshots', form.screenshots.filter((x) => x.publicId !== img.publicId))}
                        className="absolute right-1 top-1 rounded-full bg-ink-900/70 p-0.5 text-white"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                  {form.screenshots.length < 6 && (
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                      className="grid h-20 w-20 place-items-center rounded-xl border border-dashed border-ink-200 text-ink-400 hover:bg-ink-50">
                      {uploading ? <Spinner /> : <ImagePlus className="h-5 w-5" />}
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
              </div>
            </>
          )}

          {has('costs') && (
            <div className="grid grid-cols-3 gap-3">
              <Field label="Commission"><Input type="number" inputMode="decimal" step="any" {...bind('commission')} /></Field>
              <Field label="Swap"><Input type="number" inputMode="decimal" step="any" {...bind('swap')} /></Field>
              <Field label="Other fees"><Input type="number" inputMode="decimal" step="any" {...bind('fees')} /></Field>
            </div>
          )}

          {has('risk') && (
            <Field label="Risk amount (USD)" hint="Leave empty and we work it out from your stop loss. Enter a figure to override it.">
              <Input type="number" inputMode="decimal" step="any" placeholder="Calculated from your stop loss" {...bind('riskAmount')} />
            </Field>
          )}

          {has('review') && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Confidence (1 to 5)"><Input type="number" min={1} max={5} {...bind('confidence')} /></Field>
                <Field label="Self-grade (1 to 5)"><Input type="number" min={1} max={5} {...bind('selfGrade')} /></Field>
              </div>
              <Field label="Lessons"><Textarea {...bind('lessons')} /></Field>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
