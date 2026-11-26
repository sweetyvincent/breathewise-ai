import { CalendarClock } from 'lucide-react';
import { useRef, useState } from 'react';
import { LocationBar } from '@/components/LocationBar';
import { PageHeader } from '@/components/PageHeader';
import { PlanResult } from '@/components/planner/PlanResult';
import { PlannerForm } from '@/components/planner/PlannerForm';
import { ErrorState } from '@/components/ui/feedback';
import { useLocationCtx } from '@/context/LocationContext';
import { ApiError, api } from '@/lib/api';
import { saveProfileLocally } from '@/lib/profile';
import type { DailyPlanResponse, PlanProfile } from '@/lib/types';

/** Lets the result render before moving focus to its heading. */
const FOCUS_DELAY_MS = 50;

export default function Planner() {
  const { location, effectiveDemo } = useLocationCtx();
  const [result, setResult] = useState<DailyPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const generate = async (profile: PlanProfile) => {
    setLoading(true);
    setError(null);
    try {
      saveProfileLocally(profile);
      setResult(await api.dailyPlan(location, profile, effectiveDemo));
      setTimeout(() => headingRef.current?.focus(), FOCUS_DELAY_MS);
    } catch (err) {
      setError(err instanceof ApiError ? err.friendly : 'Could not generate your plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Daily routine planner"
        description="Answer a few questions and get a day plan that reflects today’s air, with the reason behind every suggestion."
        icon={<CalendarClock className="size-5" />}
      />
      <LocationBar />
      <PlannerForm locationName={location.name} loading={loading} onSubmit={generate} />

      <div aria-live="polite" className="mt-8 space-y-6">
        {error && <ErrorState message={error} />}
        {result && <PlanResult result={result} headingRef={headingRef} />}
      </div>
    </>
  );
}
