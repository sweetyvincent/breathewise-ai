import { useState } from 'react';
import { ApiError, api } from '@/lib/api';
import type { ActivityInput } from '@/lib/types';

/** Saves activities via the API and exposes busy / success / error state for the log form. */
export function useImpactLogger(onSaved: () => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const log = async (activities: ActivityInput[], successMessage: string) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.calculateImpact(activities);
      setMessage(
        `${successMessage} Estimated ${res.totals.co2SavedKg} kg CO₂ avoided, about ${res.totals.fuelSavedL} L of fuel (estimates).`,
      );
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.friendly : 'Could not save. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return { busy, error, message, log };
}
