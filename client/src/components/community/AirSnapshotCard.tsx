import { DataBadge } from '@/components/DataBadge';
import { Card, CardContent } from '@/components/ui/card';
import type { AirQuality } from '@/lib/types';

/** From this AQI category upward (Poor), community events should be postponed. */
const POSTPONE_FROM_LEVEL = 3;

export function AirSnapshotCard({ air }: { air: AirQuality }) {
  return (
    <Card className="mb-6" style={{ borderColor: air.category.color, borderWidth: 2 }}>
      <CardContent className="flex flex-wrap items-center gap-3 p-4 text-sm">
        <DataBadge source={air.source} />
        <span>
          <strong>{air.location.name}</strong>: AQI <strong>{air.aqi}</strong> ({air.category.label}).{' '}
          {air.category.level >= POSTPONE_FROM_LEVEL
            ? 'Good day to postpone outdoor community events.'
            : 'Outdoor community activities are generally reasonable; check again before you go.'}
        </span>
      </CardContent>
    </Card>
  );
}
