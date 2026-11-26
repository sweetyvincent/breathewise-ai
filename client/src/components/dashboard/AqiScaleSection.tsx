import { AqiLegend } from '@/components/AqiLegend';
import type { AirQuality } from '@/lib/types';

interface AqiScaleSectionProps {
  air: AirQuality;
}

/** Always names the scale in use (the brief forbids mixing AQI standards) and lists data caveats. */
export function AqiScaleSection({ air }: AqiScaleSectionProps) {
  return (
    <>
      <section aria-labelledby="scale-h">
        <h2 id="scale-h" className="mb-2 text-sm font-semibold text-muted-foreground">
          AQI scale used: {air.scale.name}
        </h2>
        <AqiLegend />
      </section>

      {air.notes.length > 0 && (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {air.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </>
  );
}
