/** Breathe Better Indoors: home details in, free / low-budget / advanced recommendations out. */
import { Home } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { HomeForm } from '@/components/indoor/HomeForm';
import { IndoorResults } from '@/components/indoor/IndoorResults';
import { LocationBar } from '@/components/LocationBar';
import { PageHeader } from '@/components/PageHeader';
import { ErrorState } from '@/components/ui/feedback';
import { useLocationCtx } from '@/context/LocationContext';
import { ApiError, api } from '@/lib/api';
import { DEFAULT_HOME } from '@/lib/profile';
import type { HomeProfile, IndoorResponse } from '@/lib/types';
import { safeStorage } from '@/lib/utils';

const HOME_STORAGE_KEY = 'bw.home';

export default function Indoor() {
  const { location, effectiveDemo } = useLocationCtx();
  const [home, setHome] = useState<HomeProfile>(() => safeStorage.get(HOME_STORAGE_KEY, DEFAULT_HOME));
  const [result, setResult] = useState<IndoorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setField = <K extends keyof HomeProfile>(key: K, value: HomeProfile[K]) => setHome((h) => ({ ...h, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      safeStorage.set(HOME_STORAGE_KEY, home);
      setResult(await api.indoor(location, home, effectiveDemo));
    } catch (err) {
      setError(err instanceof ApiError ? err.friendly : 'Could not load recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Breathe Better Indoors"
        description="Practical, affordable ways to keep indoor air cleaner, based on your home and today’s outdoor air."
        icon={<Home className="size-5" />}
      />
      <LocationBar />
      <HomeForm home={home} loading={loading} onChange={setField} onSubmit={submit} />
      <div aria-live="polite" className="mt-8 space-y-6">
        {error && <ErrorState message={error} />}
        {result && <IndoorResults result={result} />}
      </div>
    </>
  );
}
