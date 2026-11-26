import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MobilityOption } from '@/lib/types';
import { SUITABILITY } from './suitability';

const GRID_COLOR = '#D9E3DC';
const AXIS_TEXT_COLOR = '#3F5247';
const AXIS_FONT_SIZE = 11;
const Y_AXIS_WIDTH = 150;

interface ChartRow {
  name: string;
  kg: number;
  color: string;
  suit: string;
}

interface EmissionsChartProps {
  options: MobilityOption[];
}

/** Bar chart of CO₂e per trip. The adjacent table carries the same data as text for assistive technology. */
export function EmissionsChart({ options }: EmissionsChartProps) {
  const rows: ChartRow[] = options.map((o) => ({
    name: o.label,
    kg: o.emissionsKg,
    color: SUITABILITY[o.suitability].color,
    suit: SUITABILITY[o.suitability].label,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estimated CO₂ per trip by option</CardTitle>
      </CardHeader>
      <CardContent>
        <div role="img" aria-label="Bar chart comparing estimated CO2 emissions per trip for each transport option" className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ left: 16, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID_COLOR} />
              <XAxis type="number" unit=" kg" tick={{ fontSize: AXIS_FONT_SIZE, fill: AXIS_TEXT_COLOR }} />
              <YAxis type="category" dataKey="name" width={Y_AXIS_WIDTH} tick={{ fontSize: AXIS_FONT_SIZE, fill: AXIS_TEXT_COLOR }} />
              <Tooltip formatter={(v: number, _n, p) => [`${v} kg CO₂e · ${(p.payload as ChartRow).suit}`, 'Estimate']} />
              <Bar dataKey="kg" radius={[0, 6, 6, 0]} isAnimationActive={false}>
                {rows.map((r) => (
                  <Cell key={r.name} fill={r.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Bar colour shows suitability in today’s air (green = recommended, orange = caution, red = not advised).
        </p>
      </CardContent>
    </Card>
  );
}
