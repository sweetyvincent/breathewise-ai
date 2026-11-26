import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { POLLUTANTS } from '@/lib/aqi';
import type { PollutantKey } from '@/lib/types';

interface MainPollutantCardProps {
  dominant: PollutantKey;
}

/** Names the pollutant that sets today's AQI (the highest sub-index), with a one-line explanation. */
export function MainPollutantCard({ dominant }: MainPollutantCardProps) {
  const info = POLLUTANTS.find((p) => p.key === dominant);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Main pollutant</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <p>
          <strong>{info?.label}</strong> is driving today’s AQI. {info?.blurb}.
        </p>
      </CardContent>
    </Card>
  );
}
