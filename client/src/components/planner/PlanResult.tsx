import type { RefObject } from 'react';
import { DataQualityNote } from '@/components/DataQualityNote';
import { Alert } from '@/components/ui/feedback';
import type { DailyPlanResponse, RiskLevel } from '@/lib/types';
import { DaySlots } from './DaySlots';
import { PlanNotes } from './PlanNotes';

type AlertTone = 'success' | 'warning' | 'danger';

/** Maps the server-computed risk level to an alert style; "high" and "very high" both read as danger. */
const riskTone = (risk: RiskLevel): AlertTone => (risk === 'low' ? 'success' : risk === 'moderate' ? 'warning' : 'danger');

interface PlanResultProps {
  result: DailyPlanResponse;
  /** Receives focus after generation so keyboard and screen-reader users land on the new plan. */
  headingRef: RefObject<HTMLHeadingElement>;
}

/** The generated plan: risk summary, day slots, tips, the official-advice note and data provenance. */
export function PlanResult({ result, headingRef }: PlanResultProps) {
  const { plan } = result;
  return (
    <section aria-labelledby="plan-h" className="space-y-6">
      <h2 id="plan-h" ref={headingRef} tabIndex={-1} className="text-xl font-bold">
        Your plan for {result.dataQuality.location}
      </h2>
      <Alert tone={riskTone(plan.risk_level)} title={`Risk level today: ${plan.risk_level.replace('_', ' ')}`}>
        {plan.air_quality_summary}
      </Alert>
      <DaySlots recommendations={plan.daily_recommendations} />
      <PlanNotes indoorTips={plan.indoor_tips} sustainableActions={plan.sustainable_actions} />
      <Alert tone="info" title="Important">
        {plan.important_note}
      </Alert>
      <DataQualityNote meta={result} />
    </section>
  );
}
