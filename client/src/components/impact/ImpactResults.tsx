import type { ImpactHistory } from '@/lib/types';
import { ImpactAssumptions } from './ImpactAssumptions';
import { ImpactCharts } from './ImpactCharts';
import { ImpactSummaryCards } from './ImpactSummaryCards';
import { RecentActivity } from './RecentActivity';

/** Everything shown once impact history has loaded. */
export function ImpactResults({ history }: { history: ImpactHistory }) {
  return (
    <>
      <ImpactSummaryCards history={history} />
      <ImpactCharts history={history} />
      <RecentActivity recent={history.recent} />
      <ImpactAssumptions assumptions={history.assumptions} />
    </>
  );
}
