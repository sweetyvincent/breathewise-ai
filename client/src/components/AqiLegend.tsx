import { AQI_BANDS } from '@/lib/aqi';

export function AqiLegend() {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" aria-label="AQI categories">
      {AQI_BANDS.map((b) => (
        <li key={b.key} className="rounded-lg border px-3 py-2 text-xs" style={{ background: b.bg, color: b.fg, borderColor: b.color }}>
          <span className="block font-bold">{b.label}</span>
          <span>
            {b.min}–{b.max}
          </span>
        </li>
      ))}
    </ul>
  );
}
