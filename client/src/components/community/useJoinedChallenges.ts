import { useState } from 'react';
import { safeStorage } from '@/lib/utils';
import { CHALLENGES_STORAGE_KEY } from './content';

/** Joined challenge ids, remembered in this browser only (a per-viewer convenience, not account data). */
export function useJoinedChallenges() {
  const [joined, setJoined] = useState<string[]>(() => safeStorage.get(CHALLENGES_STORAGE_KEY, []));

  const toggle = (id: string) => {
    const next = joined.includes(id) ? joined.filter((j) => j !== id) : [...joined, id];
    setJoined(next);
    safeStorage.set(CHALLENGES_STORAGE_KEY, next);
  };

  return { joined, toggle };
}
