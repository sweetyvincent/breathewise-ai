import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EngineBadge } from '@/components/DataBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState, Skeleton } from '@/components/ui/feedback';
import type { DailyPlanResponse, PlanProfile } from '@/lib/types';
import type { AsyncState } from '@/lib/useAsync';

/** The dashboard shows only a preview; the full plan lives on the planner page. */
const PREVIEW_COUNT = 4;

interface RecommendationsCardProps {
  /** Saved profile, or null when the user has not set one up yet. */
  profile: PlanProfile | null;
  plan: AsyncState<DailyPlanResponse>;
}

/** Personalised tips for today, or an invitation to create a profile when none exists. */
export function RecommendationsCard({ profile, plan }: RecommendationsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Your recommendations for today</CardTitle>
          {plan.data && <EngineBadge generatedBy={plan.data.generatedBy} fallbackReason={plan.data.fallbackReason} />}
        </div>
        <CardDescription>Personalised from today’s air quality and your saved profile</CardDescription>
      </CardHeader>
      <CardContent>
        {!profile && <SetupPrompt />}
        {profile && plan.loading && <Skeleton className="h-24" />}
        {plan.error && <ErrorState message={plan.error} onRetry={plan.reload} />}
        {plan.data && <PlanPreview plan={plan.data} />}
      </CardContent>
    </Card>
  );
}

function SetupPrompt() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-mint-50 p-4 text-sm">
      <p>Tell us a little about your routine to get tips tailored to you, such as commute, age group and lifestyle.</p>
      <Button asChild>
        <Link to="/app/planner">
          Set up my plan <ArrowRight />
        </Link>
      </Button>
    </div>
  );
}

function PlanPreview({ plan }: { plan: DailyPlanResponse }) {
  return (
    <>
      <ul className="grid gap-3 md:grid-cols-2">
        {plan.plan.daily_recommendations.slice(0, PREVIEW_COUNT).map((r, i) => (
          <li key={i} className="rounded-lg border p-3 text-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{r.time}</p>
            <p className="font-semibold">{r.action}</p>
            <p className="mt-1 text-muted-foreground">
              <span className="font-medium text-foreground">Why:</span> {r.reason}
            </p>
          </li>
        ))}
      </ul>
      <Button variant="link" asChild className="mt-2 px-0">
        <Link to="/app/planner">
          See the full day plan <ArrowRight />
        </Link>
      </Button>
    </>
  );
}
