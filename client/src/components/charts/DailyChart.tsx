import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { bandFor } from '@/lib/aqi';
import type { DailyPoint } from '@/lib/types';

const dayLabel = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });

export function DailyChart({ daily }: { daily: DailyPoint[] }) {
  const data = daily.map((d) => ({ ...d, label: dayLabel(d.date), band: bandFor(d.aqi) }));
  return (
    <div>
      <div role="img" aria-label="Bar chart of average daily AQI for the past week" className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E3DC" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#3F5247' }} />
            <YAxis tick={{ fontSize: 11, fill: '#3F5247' }} />
            <Tooltip
              formatter={(v: number, _n, p) => [`AQI ${v} (${(p.payload as { band: { label: string } }).band.label})`, 'Daily average']}
            />
            <Bar dataKey="aqi" radius={[6, 6, 0, 0]} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.date} fill={d.band.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4">
        {data.map((d) => (
          <li key={d.date}>
            {d.label}: <strong className="text-foreground">{d.aqi}</strong> ({d.band.label})
          </li>
        ))}
      </ul>
    </div>
  );
}
