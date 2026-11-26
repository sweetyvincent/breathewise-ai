/** 24-hour AQI trend chart with a text-table alternative; observed, forecast and simulated points are distinguished. */
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AirQuality } from '@/lib/types';

const hourLabel = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric' });

export function buildTrend(air: AirQuality) {
  const pivot = Date.parse(air.fetchedAt);
  const rows = air.hourly.map((h) => {
    const past = Date.parse(h.time) <= pivot;
    return { time: h.time, label: hourLabel(h.time), past: past ? h.aqi : null, ahead: past ? null : h.aqi };
  });
  // join the two lines visually at the boundary
  const lastPast = [...rows].reverse().find((r) => r.past !== null);
  const firstAhead = rows.find((r) => r.ahead !== null);
  if (lastPast && firstAhead) lastPast.ahead = lastPast.past;
  return rows;
}

export function TrendChart({ air }: { air: AirQuality }) {
  const data = buildTrend(air);
  const sim = air.source === 'simulated';
  const max = Math.max(150, ...data.map((d) => d.past ?? d.ahead ?? 0));
  return (
    <div>
      <div
        role="img"
        aria-label={`Line chart of AQI over the last 24 hours and the next hours. Current AQI ${air.aqi}.`}
        className="h-64 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D9E3DC" />
            <XAxis dataKey="label" interval={5} tick={{ fontSize: 11, fill: '#3F5247' }} />
            <YAxis domain={[0, Math.ceil(max / 50) * 50]} tick={{ fontSize: 11, fill: '#3F5247' }} />
            {[100, 200, 300]
              .filter((v) => v < max)
              .map((v) => (
                <ReferenceLine key={v} y={v} stroke="#94A3A0" strokeDasharray="2 4" />
              ))}
            <Tooltip
              formatter={(v: number) => [`AQI ${v}`, '']}
              labelFormatter={(_l, p) => (p[0] ? new Date((p[0].payload as { time: string }).time).toLocaleString() : '')}
            />
            <Line
              type="monotone"
              dataKey="past"
              name={sim ? 'Simulated (past)' : 'Observed'}
              stroke="#14532D"
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="ahead"
              name={sim ? 'Simulated (outlook)' : 'Forecast'}
              stroke="#059669"
              strokeWidth={2.5}
              strokeDasharray="6 4"
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Solid line: {sim ? 'simulated past hours' : 'observed (measured/modelled by the provider)'}. Dashed line:{' '}
        {sim ? 'simulated outlook' : 'provider forecast'}. Forecasts are estimates, not measurements.
      </p>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer font-medium text-primary">View chart data as a table</summary>
        <div className="mt-2 max-h-56 overflow-auto rounded-lg border">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">Hourly AQI values</caption>
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th scope="col" className="p-2">
                  Time
                </th>
                <th scope="col" className="p-2">
                  AQI
                </th>
                <th scope="col" className="p-2">
                  Type
                </th>
              </tr>
            </thead>
            <tbody>
              {air.hourly.map((h) => (
                <tr key={h.time} className="border-t">
                  <td className="p-2">{new Date(h.time).toLocaleString()}</td>
                  <td className="p-2">{h.aqi}</td>
                  <td className="p-2">
                    {Date.parse(h.time) <= Date.parse(air.fetchedAt)
                      ? sim
                        ? 'Simulated'
                        : 'Observed'
                      : sim
                        ? 'Simulated outlook'
                        : 'Forecast'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
