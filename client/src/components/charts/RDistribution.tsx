import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function RDistribution({ data }: { data: { bucket: string; count: number }[] }) {
  return (
    <div className="h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3e6f0" vertical={false} />
          <XAxis dataKey="bucket" interval={0} angle={-35} textAnchor="end" height={50} tick={{ fontSize: 10, fill: '#8089a6' }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#8089a6' }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: '#eef0f7' }} contentStyle={{ borderRadius: 12, border: '1px solid #e3e6f0', fontSize: 12 }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Trades">
            {data.map((d, i) => <Cell key={d.bucket} fill={i < 4 ? '#d9534f' : '#3fa877'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
