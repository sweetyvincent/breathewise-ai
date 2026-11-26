import { Fuel, Leaf, Route as RouteIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { ImpactHistory } from '@/lib/types';

const SCORE_MAX = 100;

interface KpiProps {
  icon: ReactNode;
  label: string;
  value: string;
}

function Kpi({ icon, label, value }: KpiProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          {icon}
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function ScoreCard({ score }: { score: ImpactHistory['score'] }) {
  return (
    <Card className="border-2 border-emerald-700">
      <CardContent className="p-4">
        <p className="text-xs font-semibold text-muted-foreground">Sustainability score (7 days)</p>
        <p className="mt-1 text-3xl font-bold text-forest-900">
          {score.value}
          <span className="text-base font-medium text-muted-foreground"> / {SCORE_MAX}</span>
        </p>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={score.value}
          aria-valuemin={0}
          aria-valuemax={SCORE_MAX}
          aria-label="Sustainability score"
        >
          <div className="h-full bg-emerald-600 transition-all" style={{ width: `${score.value}%` }} />
        </div>
        <p className="mt-1 text-xs font-medium">{score.label}</p>
      </CardContent>
    </Card>
  );
}

/** Four headline numbers: 30-day CO₂, trips and fuel (all estimates) plus the 7-day score. */
export function ImpactSummaryCards({ history }: { history: ImpactHistory }) {
  const { last30Days, score } = history;
  return (
    <section aria-label="Summary" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Kpi icon={<Leaf className="size-4" />} label="CO₂ avoided (30 days, est.)" value={`${last30Days.co2SavedKg} kg`} />
      <Kpi icon={<RouteIcon className="size-4" />} label="Sustainable trips (30 days)" value={String(last30Days.trips)} />
      <Kpi icon={<Fuel className="size-4" />} label="Fuel saved (30 days, est.)" value={`${last30Days.fuelSavedL} L`} />
      <ScoreCard score={score} />
    </section>
  );
}
