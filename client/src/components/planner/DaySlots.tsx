import { Moon, Sun, Sunrise, Sunset } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DailyPlan } from '@/lib/types';

/** Display order and icon for each part of the day. */
const SLOTS = [
  { key: 'Morning', icon: Sunrise },
  { key: 'Afternoon', icon: Sun },
  { key: 'Evening', icon: Sunset },
  { key: 'Night', icon: Moon },
] as const;

interface DaySlotsProps {
  recommendations: DailyPlan['daily_recommendations'];
}

/** One card per part of the day; every action shows its reason and impact, as the brief requires. */
export function DaySlots({ recommendations }: DaySlotsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {SLOTS.map(({ key, icon: Icon }) => {
        const items = recommendations.filter((r) => r.time === key);
        if (!items.length) return null;
        return (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="size-5 text-emerald-700" aria-hidden="true" />
                {key}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {items.map((r, i) => (
                  <li key={i} className="text-sm">
                    <p className="font-semibold">{r.action}</p>
                    <p className="mt-1">
                      <span className="font-medium">Why: </span>
                      <span className="text-muted-foreground">{r.reason}</span>
                    </p>
                    <p>
                      <span className="font-medium">Impact: </span>
                      <span className="text-muted-foreground">{r.impact}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
