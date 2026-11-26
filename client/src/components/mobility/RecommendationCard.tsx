import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MobilityResult } from '@/lib/types';

interface RecommendationCardProps {
  result: MobilityResult;
}

/** The single recommended option with its headline numbers (all server-computed estimates). */
export function RecommendationCard({ result }: RecommendationCardProps) {
  const { recommended, weekly } = result;
  const chosen = result.options.find((o) => o.mode === recommended.mode);
  return (
    <Card className="border-2 border-emerald-700">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="live">Recommended today</Badge>
          <CardTitle className="text-xl">{recommended.label}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{recommended.rationale}</p>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
          <Metric label="Distance" value={`${result.distanceKm} km`} />
          <Metric label="Emissions per trip" value={`${chosen?.emissionsKg ?? 0} kg CO₂e`} />
          <Metric label="Saved vs your choice (per trip)" value={`${chosen?.savedVsPreferredKg ?? 0} kg`} />
          <Metric label={`Saved per week (${weekly.tripsPerWeek} trips)`} value={`${weekly.savedKg} kg`} />
        </dl>
        <p className="text-xs text-muted-foreground">All emission figures are estimates (see assumptions below).</p>
      </CardContent>
    </Card>
  );
}

interface MetricProps {
  label: string;
  value: string;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-lg bg-mint-50 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-bold">{value}</dd>
    </div>
  );
}
