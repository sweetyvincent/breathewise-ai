/** Impact tracker: log sustainable trips and see estimated CO2 and fuel saved (estimates only). */
import { Leaf } from 'lucide-react';
import { ImpactLogForm } from '@/components/impact/ImpactLogForm';
import { ImpactResults } from '@/components/impact/ImpactResults';
import { useImpactLogger } from '@/components/impact/useImpactLogger';
import { PageHeader } from '@/components/PageHeader';
import { SignInPrompt } from '@/components/SignInPrompt';
import { Alert, ErrorState, Skeleton } from '@/components/ui/feedback';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';

const DEFAULT_DISCLAIMER =
  'Your CO₂ savings are estimates and do not reduce your local AQI by a measurable amount. City air improves when many people and sources cut emissions together.';

export default function Impact() {
  const { isAuthed } = useAuth();
  const history = useAsync((_s) => api.impactHistory(), [isAuthed], isAuthed);
  const logger = useImpactLogger(history.reload);

  if (!isAuthed) {
    return (
      <>
        <PageHeader
          title="Impact tracker"
          description="Estimate the CO₂ and fuel you avoid through everyday choices."
          icon={<Leaf className="size-5" />}
        />
        <SignInPrompt feature="the Impact Tracker" />
      </>
    );
  }

  const data = history.data;
  return (
    <>
      <PageHeader
        title="Impact tracker"
        description="Log sustainable choices and see your estimated impact. Every figure is an estimate with transparent assumptions."
        icon={<Leaf className="size-5" />}
      />

      <Alert tone="info" title="Personal savings vs. city air quality" className="mb-6">
        {data?.disclaimer ?? DEFAULT_DISCLAIMER}
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        <ImpactLogForm busy={logger.busy} message={logger.message} error={logger.error} onLog={logger.log} />
        <div className="space-y-6 lg:col-span-2">
          {history.loading && !data && <Skeleton className="h-64" />}
          {history.error && <ErrorState message={history.error} onRetry={history.reload} />}
          {data && <ImpactResults history={data} />}
        </div>
      </div>
    </>
  );
}
