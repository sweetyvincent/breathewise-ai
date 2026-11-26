import { AqiGauge } from '@/components/AqiGauge';
import { DataBadge } from '@/components/DataBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AirQuality } from '@/lib/types';
import { formatTime, timeAgo } from '@/lib/utils';

interface AqiOverviewCardProps {
  air: AirQuality;
}

/** Headline reading: gauge, plain-language meaning, data freshness and the scale in use. */
export function AqiOverviewCard({ air }: AqiOverviewCardProps) {
  const { category } = air;
  return (
    <Card className="lg:col-span-3" style={{ borderColor: category.color, borderWidth: 2 }}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">{air.location.name}</CardTitle>
          <DataBadge source={air.source} />
        </div>
        <CardDescription>
          Observed {formatTime(air.observedAt)} ({timeAgo(air.observedAt)}){air.cached ? ' · cached' : ''} · Scale: {air.scale.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid items-center gap-4 sm:grid-cols-2">
        {/* The dark `fg` colour keeps the gauge label at AA contrast; `color` is reserved for borders and fills. */}
        <AqiGauge aqi={air.aqi} label={category.label} color={category.fg} />
        <div className="space-y-3">
          <p className="rounded-lg p-3 text-sm font-medium" style={{ background: category.bg, color: category.fg }}>
            {category.healthMessage}
          </p>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Sensitive groups:</strong> {category.sensitiveMessage}
          </p>
          <p className="text-xs text-muted-foreground">{air.scale.note}</p>
        </div>
      </CardContent>
    </Card>
  );
}
