import { Droplets, Thermometer, Wind } from 'lucide-react';
import type { ReactNode } from 'react';
import { DataBadge } from '@/components/DataBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/feedback';
import type { Weather } from '@/lib/types';
import type { AsyncState } from '@/lib/useAsync';

interface WeatherCardProps {
  weather: AsyncState<Weather>;
}

/** Weather is secondary: if it fails, say so and make clear the air-quality data is unaffected. */
export function WeatherCard({ weather }: WeatherCardProps) {
  const { data, loading, error } = weather;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weather</CardTitle>
        <CardDescription>
          {data ? (
            <>
              <DataBadge source={data.source} /> {data.description}
            </>
          ) : (
            'Current conditions'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && !data && <Skeleton className="h-16" />}
        {error && !data && (
          <p className="text-sm text-muted-foreground">Weather is unavailable right now. Air-quality information is unaffected.</p>
        )}
        {data && (
          <dl className="grid grid-cols-3 gap-2 text-center">
            <Stat icon={<Thermometer className="size-4" />} label="Temperature" value={`${data.tempC}°C`} />
            <Stat icon={<Droplets className="size-4" />} label="Humidity" value={`${data.humidity}%`} />
            <Stat icon={<Wind className="size-4" />} label="Wind" value={`${data.windSpeedMs} m/s`} />
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

interface StatProps {
  icon: ReactNode;
  label: string;
  value: string;
}

function Stat({ icon, label, value }: StatProps) {
  return (
    <div className="rounded-lg bg-muted/60 p-2">
      <dt className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-lg font-bold">{value}</dd>
    </div>
  );
}
