import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ImpactHistory } from '@/lib/types';
import { ImpactChart } from './ImpactChart';

/** Weekly (8 weeks) and monthly (6 months) CO₂ charts side by side. */
export function ImpactCharts({ history }: { history: ImpactHistory }) {
  const weekly = history.weekly.map((w) => ({ label: w.weekStart.slice(5), kg: w.co2SavedKg, trips: w.trips }));
  const monthly = history.monthly.map((m) => ({ label: m.month, kg: m.co2SavedKg, trips: m.trips }));
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Weekly impact</CardTitle>
          <CardDescription>Estimated kg CO₂ avoided, last 8 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <ImpactChart data={weekly} name="Week of" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Monthly impact</CardTitle>
          <CardDescription>Estimated kg CO₂ avoided, last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ImpactChart data={monthly} name="Month" />
        </CardContent>
      </Card>
    </div>
  );
}
