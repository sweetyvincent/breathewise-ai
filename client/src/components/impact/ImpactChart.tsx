import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface ImpactChartPoint {
  label: string;
  kg: number;
  trips: number;
}

interface ImpactChartProps {
  data: ImpactChartPoint[];
  /** Tooltip series name, e.g. "Week of". */
  name: string;
}

const GRID_COLOR = '#D9E3DC';
const AXIS_COLOR = '#3F5247';
const BAR_COLOR = '#059669';

/** Bar chart of estimated CO₂ avoided; the `role="img"` label gives screen-reader users the same figures. */
export function ImpactChart({ data, name }: ImpactChartProps) {
  const description = data.map((d) => `${d.label}: ${d.kg} kilograms`).join('; ');
  return (
    <div role="img" aria-label={`Bar chart of estimated CO2 avoided. ${description}`} className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_COLOR} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: AXIS_COLOR }} />
          <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} />
          <Tooltip formatter={(v: number, _n, p) => [`${v} kg CO₂ (est.) · ${(p.payload as ImpactChartPoint).trips} trips`, name]} />
          <Bar dataKey="kg" fill={BAR_COLOR} radius={[6, 6, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
