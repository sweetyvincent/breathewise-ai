import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MobilityOption } from '@/lib/types';
import { SUITABILITY } from './suitability';

const COLUMNS = ['Option', 'CO₂e / trip', 'Saved vs yours', 'Time', 'Today’s suitability', 'Exposure note'] as const;

interface OptionsTableProps {
  options: MobilityOption[];
}

/** Accessible text version of the comparison, including the exposure note for each mode. */
export function OptionsTable({ options }: OptionsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Options, emissions and exposure</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">Transport options compared by emissions, time and exposure</caption>
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              {COLUMNS.map((c) => (
                <th key={c} scope="col" className="p-2">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {options.map((o) => (
              <tr key={o.mode} className="border-b align-top">
                <th scope="row" className="p-2 font-medium">
                  {o.label}
                </th>
                <td className="p-2">{o.emissionsKg} kg</td>
                <td className="p-2">{o.savedVsPreferredKg} kg</td>
                <td className="p-2">{o.minutes} min</td>
                <td className="p-2">
                  <Badge variant={SUITABILITY[o.suitability].variant}>{SUITABILITY[o.suitability].label}</Badge>
                </td>
                <td className="p-2 text-muted-foreground">{o.exposureNote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
