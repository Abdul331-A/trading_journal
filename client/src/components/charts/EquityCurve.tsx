import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { money } from '@/lib/format';

export function EquityCurve({ data, currency }: { data: { time: string; equity: number }[]; currency: string }) {
  const rows = data.map((d) => ({ ...d, t: +new Date(d.time) }));
  const fmtDate = (t: number) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return (
    <div className="h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4066e0" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#4066e0" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3e6f0" vertical={false} />
          <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={fmtDate} tick={{ fontSize: 11, fill: '#8089a6' }} axisLine={false} tickLine={false} minTickGap={40} />
          <YAxis tick={{ fontSize: 11, fill: '#8089a6' }} axisLine={false} tickLine={false} width={52} tickFormatter={(v) => money(v, currency).replace(/\.00$/, '')} />
          <Tooltip formatter={(v: number) => [money(v, currency), 'P&L']} labelFormatter={(t: number) => fmtDate(t)} contentStyle={{ borderRadius: 12, border: '1px solid #e3e6f0', fontSize: 12 }} />
          <Area type="monotone" dataKey="equity" stroke="#3354d1" strokeWidth={2.5} fill="url(#eq)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
