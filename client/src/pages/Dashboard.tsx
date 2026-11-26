/** Air-quality dashboard: current AQI, pollutants, weather, trends and tailored guidance. */
import { Gauge } from 'lucide-react';
import { AqiOverviewCard } from '@/components/dashboard/AqiOverviewCard';
import { AqiScaleSection } from '@/components/dashboard/AqiScaleSection';
import { DashboardError } from '@/components/dashboard/DashboardError';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ALERT_MIN_LEVEL, HealthAlert } from '@/components/dashboard/HealthAlert';
import { MainPollutantCard } from '@/components/dashboard/MainPollutantCard';
import { PollutantGrid } from '@/components/dashboard/PollutantGrid';
import { RecommendationsCard } from '@/components/dashboard/RecommendationsCard';
import { TrendSection } from '@/components/dashboard/TrendSection';
import { WeatherCard } from '@/components/dashboard/WeatherCard';
import { LocationBar } from '@/components/LocationBar';
import { PageHeader } from '@/components/PageHeader';
import { useLocationCtx } from '@/context/LocationContext';
import { api } from '@/lib/api';
import { hashOf, loadSavedProfile } from '@/lib/profile';
import type { DailyPlanResponse } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';
import { safeStorage } from '@/lib/utils';

export default function Dashboard() {
  const { location, effectiveDemo, mode, setForceDemo } = useLocationCtx();
  const modeKnown = mode !== null; // wait for /health so the first request already uses the right data source
  const air = useAsync(
    (s) => api.airQuality(location, effectiveDemo, s),
    [location.lat, location.lon, location.name, effectiveDemo],
    modeKnown,
  );
  const weather = useAsync((s) => api.weather(location, effectiveDemo, s), [location.lat, location.lon, effectiveDemo], modeKnown);
  const profile = loadSavedProfile();
  const a = air.data;

  // The preview plan is cached per session, keyed by everything that changes the advice, to avoid repeat AI calls.
  const plan = useAsync<DailyPlanResponse>(
    async () => {
      const key = `bw.dashPlan:${location.lat},${location.lon}:${effectiveDemo}:${a!.aqi}:${hashOf(profile)}`;
      const cached = safeStorage.get<DailyPlanResponse | null>(key, null, globalThis.sessionStorage);
      if (cached) return cached;
      const res = await api.dailyPlan(location, profile!, effectiveDemo);
      safeStorage.set(key, res, globalThis.sessionStorage);
      return res;
    },
    [a?.aqi, a?.location.lat, a?.location.lon, effectiveDemo, hashOf(profile)],
    Boolean(a && profile),
  );

  const refresh = () => {
    air.reload();
    weather.reload();
  };

  return (
    <>
      <PageHeader
        title="Air quality dashboard"
        description="What the air is like right now, what it means, and what to do about it."
        icon={<Gauge className="size-5" />}
      />
      <LocationBar onRefresh={refresh} refreshing={air.loading} />

      {air.loading && !a && <DashboardSkeleton />}

      {air.error && !a && (
        <DashboardError
          message={air.error}
          onRetry={air.reload}
          offerDemo={mode?.airQuality === 'live' && !effectiveDemo}
          onUseDemo={() => setForceDemo(true)}
        />
      )}

      {a && (
        <div className="space-y-6" aria-busy={air.loading}>
          {a.category.level >= ALERT_MIN_LEVEL && <HealthAlert air={a} />}

          <div className="grid gap-6 lg:grid-cols-5">
            <AqiOverviewCard air={a} />
            <div className="grid gap-6 lg:col-span-2">
              <WeatherCard weather={weather} />
              <MainPollutantCard dominant={a.dominantPollutant} />
            </div>
          </div>

          <PollutantGrid pollutants={a.pollutants} dominant={a.dominantPollutant} />
          <TrendSection air={a} />
          <RecommendationsCard profile={profile} plan={plan} />
          <AqiScaleSection air={a} />
        </div>
      )}
    </>
  );
}
