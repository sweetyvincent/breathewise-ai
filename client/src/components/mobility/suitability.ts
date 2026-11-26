import type { Suitability } from '@/lib/types';

type BadgeVariant = 'live' | 'default' | 'warning' | 'danger' | 'outline';

interface SuitabilityStyle {
  label: string;
  variant: BadgeVariant;
  /** Bar colour in the emissions chart. The label always accompanies it, so colour is never the only cue. */
  color: string;
}

/** How each suitability rating is shown: text label, badge style and chart colour. */
export const SUITABILITY: Record<Suitability, SuitabilityStyle> = {
  recommended: { label: 'Recommended', variant: 'live', color: '#059669' },
  ok: { label: 'Suitable', variant: 'default', color: '#65A30D' },
  caution: { label: 'Use caution', variant: 'warning', color: '#EA580C' },
  not_advised: { label: 'Not advised today', variant: 'danger', color: '#DC2626' },
  impractical: { label: 'Impractical distance', variant: 'outline', color: '#94A3A0' },
};
