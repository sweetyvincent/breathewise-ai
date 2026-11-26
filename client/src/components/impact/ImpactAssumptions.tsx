/** Collapsible list of the transparent calculation assumptions behind every estimate. */
export function ImpactAssumptions({ assumptions }: { assumptions: string[] }) {
  return (
    <details className="rounded-lg border bg-card p-4 text-sm">
      <summary className="cursor-pointer font-semibold">How these estimates are calculated</summary>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
        {assumptions.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </details>
  );
}
