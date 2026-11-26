import { Card, CardContent } from '@/components/ui/card';
import { AWARENESS_TIPS, INITIATIVES } from './content';

/** Neighbourhood initiatives and awareness tips, side by side on wide screens. */
export function LocalActionSections() {
  return (
    <div className="mt-10 grid gap-6 md:grid-cols-2">
      <section aria-labelledby="init-h">
        <h2 id="init-h" className="mb-3 text-xl font-bold">
          Neighbourhood clean-air initiatives
        </h2>
        <ul className="space-y-3">
          {INITIATIVES.map((i) => (
            <li key={i.title} className="rounded-lg border bg-card p-4 text-sm">
              <p className="font-semibold">{i.title}</p>
              <p className="text-muted-foreground">{i.text}</p>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="tips-h">
        <h2 id="tips-h" className="mb-3 text-xl font-bold">
          Awareness tips
        </h2>
        <Card>
          <CardContent className="p-5">
            <ul className="list-disc space-y-2 pl-5 text-sm">
              {AWARENESS_TIPS.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
