/**
 * Transport-agnostic API logic.
 *
 * Every endpoint is a plain async function (validated input in, JSON-serialisable result out). The Express
 * routes call these for the real server, and the GitHub Pages build calls the very same functions inside the
 * browser. Nothing under `core/` may import Express, Node-only APIs or vendor SDKs.
 *
 * Layout: one file per feature area, composed here.
 *   environment.ts      health, air quality, weather, location search
 *   recommendations.ts  daily plan, indoor, mobility, BreatheBot chat
 *   impact.ts           impact calculator and history
 *   community.ts        pollution reports
 *   profile.ts          user profile
 */
import { createCommunityHandlers } from './community';
import { createContextLoader } from './context';
import { createEnvironmentHandlers } from './environment';
import { createImpactHandlers } from './impact';
import { createProfileHandlers } from './profile';
import { createRecommendationHandlers } from './recommendations';
import type { CoreDeps } from './types';

export type { CallUser, CoreDeps, ServerModeInfo } from './types';
export { toPublicReport } from './presenters';

export function createHandlers(deps: CoreDeps) {
  const context = createContextLoader(deps);
  return {
    ...createEnvironmentHandlers(deps, context),
    ...createRecommendationHandlers(deps, context),
    ...createImpactHandlers(deps),
    ...createCommunityHandlers(deps),
    ...createProfileHandlers(deps),
  };
}

export type Handlers = ReturnType<typeof createHandlers>;
