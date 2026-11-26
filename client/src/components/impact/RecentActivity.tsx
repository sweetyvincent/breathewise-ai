import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ImpactHistory } from '@/lib/types';

const MAX_RECENT_ROWS = 8;

/** Latest logged actions, newest first. */
export function RecentActivity({ recent }: { recent: ImpactHistory['recent'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing logged yet. Add an action or load the sample data.</p>
        ) : (
          <ul className="divide-y text-sm">
            {recent.slice(0, MAX_RECENT_ROWS).map((r) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>
                  {r.label} · {r.trips} {r.trips === 1 ? 'trip' : 'trips'}
                  {r.distanceKm ? ` · ${r.distanceKm} km` : ''}
                </span>
                <span className="text-muted-foreground">
                  ≈ {r.co2SavedKg} kg CO₂ · {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
