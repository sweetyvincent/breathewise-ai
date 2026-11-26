import { Card, CardContent } from '@/components/ui/card';
import { POLLUTANTS } from '@/lib/aqi';
import type { PollutantKey } from '@/lib/types';

interface PollutantGridProps {
  pollutants: Record<PollutantKey, number>;
  dominant: PollutantKey;
}

/** One tile per pollutant; the dominant one is outlined and labelled in text, so colour is never the only cue. */
export function PollutantGrid({ pollutants, dominant }: PollutantGridProps) {
  return (
    <section aria-labelledby="pollutants-h">
      <h2 id="pollutants-h" className="mb-3 text-lg font-semibold">
        Pollutant concentrations
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {POLLUTANTS.map((p) => (
          <li key={p.key}>
            <Card className={p.key === dominant ? 'border-2 border-primary' : ''}>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground">
                  {p.label}
                  {p.key === dominant ? ' · main' : ''}
                </p>
                <p className="mt-1 text-2xl font-bold">{pollutants[p.key]}</p>
                <p className="text-xs text-muted-foreground">{p.unit}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
