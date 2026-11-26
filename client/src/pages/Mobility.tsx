/** Sustainable mobility: compare travel options on emissions and pollution exposure. */
import { Route as RouteIcon } from 'lucide-react';
import { useState } from 'react';
import { DataQualityNote } from '@/components/DataQualityNote';
import { LocationBar } from '@/components/LocationBar';
import { EmissionsChart } from '@/components/mobility/EmissionsChart';
import { IdeasAndAssumptions } from '@/components/mobility/IdeasAndAssumptions';
import { MobilityForm, type TripFormValues } from '@/components/mobility/MobilityForm';
import { OptionsTable } from '@/components/mobility/OptionsTable';
import { RecommendationCard } from '@/components/mobility/RecommendationCard';
import { PageHeader } from '@/components/PageHeader';
import { Alert, ErrorState } from '@/components/ui/feedback';
import { useLocationCtx } from '@/context/LocationContext';
import { ApiError, api } from '@/lib/api';
import type { MobilityResponse } from '@/lib/types';

export default function Mobility() {
  const { location, effectiveDemo } = useLocationCtx();
  const [result, setResult] = useState<MobilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compare = async (trip: TripFormValues) => {
    setLoading(true);
    setError(null);
    try {
      setResult(
        await api.mobility({
          location,
          ...trip,
          origin: trip.origin || undefined,
          destination: trip.destination || undefined,
          demo: effectiveDemo,
        }),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.friendly : 'Could not compare options. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const r = result?.result;

  return (
    <>
      <PageHeader
        title="Sustainable mobility"
        description="Compare ways to make a trip by estimated emissions and by exposure to today’s air. The greenest choice isn’t always the healthiest on a smoggy day."
        icon={<RouteIcon className="size-5" />}
      />
      <LocationBar />
      <MobilityForm loading={loading} onSubmit={compare} />

      <div aria-live="polite" className="mt-8 space-y-6">
        {error && <ErrorState message={error} />}
        {r && result && (
          <>
            <RecommendationCard result={r} />
            <EmissionsChart options={r.options} />
            <OptionsTable options={r.options} />
            <IdeasAndAssumptions ideas={r.additionalIdeas} assumptions={r.assumptions} />
            <Alert tone="info" title="Important">
              {r.importantNote}
            </Alert>
            <DataQualityNote meta={result} />
          </>
        )}
      </div>
    </>
  );
}
