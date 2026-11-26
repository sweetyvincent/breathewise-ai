import type { EnvironmentContext } from '../services/types';
import type { CoreDeps } from './types';

/** Shared lookups used by several handler groups (air + weather fetching and privacy preferences). */
export function createContextLoader(d: CoreDeps) {
  /** Simulated data is used when the caller asks for it, or when no live provider exists at all. */
  const isForcedSimulated = (demo?: boolean) => Boolean(demo) || d.alwaysSimulated === true;

  /** Fetch air + weather once for a location. A weather failure degrades gracefully; an air failure propagates. */
  async function loadContext(loc: { lat: number; lon: number; name?: string }, demo?: boolean): Promise<EnvironmentContext> {
    const forceSimulated = isForcedSimulated(demo);
    const [air, weather] = await Promise.all([
      d.air.get(loc, { forceSimulated }),
      d.weather.get(loc, { forceSimulated }).catch(() => null),
    ]);
    return { air, weather };
  }

  /** The user's saved privacy switches (both default to "save" until they opt out). */
  async function privacyOf(userId: string): Promise<{ saveAqiHistory?: boolean; saveChatHistory?: boolean }> {
    return ((await d.store.getUser(userId))?.preferences?.privacy ?? {}) as { saveAqiHistory?: boolean; saveChatHistory?: boolean };
  }

  return { isForcedSimulated, loadContext, privacyOf };
}

export type ContextLoader = ReturnType<typeof createContextLoader>;
