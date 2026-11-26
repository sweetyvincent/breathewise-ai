import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface IdeasAndAssumptionsProps {
  ideas: string[];
  assumptions: string[];
}

/** Extra ways to cut exposure, next to the (always visible) assumptions behind every emission estimate. */
export function IdeasAndAssumptions({ ideas, assumptions }: IdeasAndAssumptionsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Other ways to cut exposure and emissions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {ideas.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Assumptions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            {assumptions.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
