import { DataQualityNote } from '@/components/DataQualityNote';
import { Alert } from '@/components/ui/feedback';
import type { IndoorPlan, IndoorResponse, RiskLevel } from '@/lib/types';
import { GuidanceCards } from './GuidanceCards';
import { MaintenanceReminders } from './MaintenanceReminders';
import { MythsList } from './MythsList';
import { SolutionTabs } from './SolutionTabs';

const RISK_TONE = { low: 'success', moderate: 'warning' } as const;
const toneFor = (risk: RiskLevel) => (risk === 'low' || risk === 'moderate' ? RISK_TONE[risk] : 'danger');

/** Full recommendation set returned by the indoor endpoint. */
export function IndoorResults({ result }: { result: IndoorResponse }) {
  const plan: IndoorPlan = result.recommendations;
  return (
    <>
      <Alert tone={toneFor(plan.risk_level)} title="Outdoor air right now">
        {plan.summary}
      </Alert>
      <GuidanceCards plan={plan} />
      <SolutionTabs solutions={plan.solutions} />
      <MaintenanceReminders reminders={plan.maintenance_reminders} />
      <MythsList myths={plan.myths} />
      <Alert tone="info" title="Important">
        {plan.important_note}
      </Alert>
      <DataQualityNote meta={result} />
    </>
  );
}
