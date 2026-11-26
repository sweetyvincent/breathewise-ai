import { DailyChart } from '@/components/charts/DailyChart';
import { TrendChart } from '@/components/charts/TrendChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AirQuality } from '@/lib/types';

interface TrendSectionProps {
  air: AirQuality;
}

/** 24-hour trend and 7-day history. History can be missing (provider limits), so that card degrades to a message. */
export function TrendSection({ air }: TrendSectionProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>24-hour AQI trend</CardTitle>
          <CardDescription>Past 24 hours and the hours ahead</CardDescription>
        </CardHeader>
        <CardContent>
          <TrendChart air={air} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>7-day pollution history</CardTitle>
          <CardDescription>Average daily AQI</CardDescription>
        </CardHeader>
        <CardContent>
          {air.daily.length ? (
            <DailyChart daily={air.daily} />
          ) : (
            <p className="text-sm text-muted-foreground">History is unavailable for this location right now.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
