import { Ban, CheckCircle2 } from 'lucide-react';
import type { IndoorPlan } from '@/lib/types';

/** Common beliefs paired with what the evidence says (icons are decorative; the myth is announced as "Myth:"). */
export function MythsList({ myths }: { myths: IndoorPlan['myths'] }) {
  return (
    <section aria-labelledby="myth-h">
      <h2 id="myth-h" className="mb-2 text-lg font-semibold">
        Myths versus evidence
      </h2>
      <ul className="grid gap-3 md:grid-cols-2">
        {myths.map((m) => (
          <li key={m.myth} className="rounded-lg border bg-card p-4 text-sm">
            <p className="flex items-start gap-2 font-semibold">
              <Ban className="mt-0.5 size-4 shrink-0 text-red-800" aria-hidden="true" />
              <span>
                <span className="sr-only">Myth: </span>
                {m.myth}
              </span>
            </p>
            <p className="mt-2 flex items-start gap-2 text-muted-foreground">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" />
              <span>
                <span className="font-medium text-foreground">Evidence: </span>
                {m.reality}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
