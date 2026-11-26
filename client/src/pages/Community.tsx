/** Community hub: local reports (labelled unverified), challenges and clean-air initiatives. */
import { Users } from 'lucide-react';
import { AirSnapshotCard } from '@/components/community/AirSnapshotCard';
import { ChallengesSection } from '@/components/community/ChallengesSection';
import { LocalActionSections } from '@/components/community/LocalActionSections';
import { ReportForm } from '@/components/community/ReportForm';
import { ReportsSection } from '@/components/community/ReportsSection';
import { useJoinedChallenges } from '@/components/community/useJoinedChallenges';
import { LocationBar } from '@/components/LocationBar';
import { PageHeader } from '@/components/PageHeader';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useAuth } from '@/context/AuthContext';
import { useLocationCtx } from '@/context/LocationContext';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';

export default function Community() {
  const { location, effectiveDemo, mode } = useLocationCtx();
  const { isAuthed } = useAuth();
  const reports = useAsync(() => api.reports(location), [location.lat, location.lon]);
  const snapshot = useAsync((s) => api.airQuality(location, effectiveDemo, s), [location.lat, location.lon, effectiveDemo], mode !== null);
  const { joined, toggle } = useJoinedChallenges();

  return (
    <>
      <PageHeader
        title="Community hub"
        description="Clean air is a shared effort. See what neighbours are reporting, join challenges and take local action."
        icon={<Users className="size-5" />}
      />
      <LocationBar />
      {snapshot.data && <AirSnapshotCard air={snapshot.data} />}

      <div className="grid gap-6 lg:grid-cols-5">
        <ReportsSection reports={reports.data?.reports} loading={reports.loading} error={reports.error} onRetry={reports.reload} />
        <section aria-labelledby="submit-h" className="lg:col-span-2">
          <h2 id="submit-h" className="mb-4 text-xl font-bold">
            Report a pollution source
          </h2>
          {isAuthed ? <ReportForm onDone={reports.reload} /> : <SignInPrompt feature="community reporting" />}
        </section>
      </div>

      <ChallengesSection joined={joined} onToggle={toggle} />
      <LocalActionSections />
    </>
  );
}
