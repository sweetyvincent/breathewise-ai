import { Badge } from '@/components/ui/badge';
import type { Solution } from '@/lib/types';

const EVIDENCE_LABEL = { strong: 'Strong evidence', moderate: 'Moderate evidence', limited: 'Limited evidence' } as const;

/** Cards for one budget tier. Items above the user's budget stay visible (dimmed) as later upgrades. */
export function SolutionList({ items }: { items: Solution[] }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {items.map((s) => (
        <li key={s.title} className={`rounded-lg border bg-card p-4 text-sm ${s.fits_budget ? '' : 'opacity-80'}`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-semibold">{s.title}</p>
            <Badge variant={s.evidence === 'strong' ? 'live' : 'default'}>{EVIDENCE_LABEL[s.evidence]}</Badge>
          </div>
          <p className="mt-1">{s.detail}</p>
          <p className="mt-1 text-muted-foreground">
            <span className="font-medium text-foreground">Why it helps: </span>
            {s.why}
          </p>
          {!s.fits_budget && <p className="mt-2 text-xs font-semibold text-amber-900">Above your selected budget: a good later upgrade.</p>}
        </li>
      ))}
    </ul>
  );
}
