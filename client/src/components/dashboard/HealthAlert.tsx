import { AlertTriangle } from 'lucide-react';
import type { AirQuality } from '@/lib/types';

/** Category level from which a prominent alert is shown (3 = "Poor" on the CPCB scale). */
export const ALERT_MIN_LEVEL = 3;

interface HealthAlertProps {
  air: AirQuality;
}

/** Announces poor-or-worse air immediately (role="alert") and always points to official advisories. */
export function HealthAlert({ air }: HealthAlertProps) {
  const { category } = air;
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-lg border-2 p-4"
      style={{ background: category.bg, color: category.fg, borderColor: category.color }}
    >
      <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-bold">Health alert: {category.label} air quality</p>
        <p className="text-sm">{category.sensitiveMessage} Please follow official local health advisories.</p>
      </div>
    </div>
  );
}
