import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { IndoorPlan } from '@/lib/types';

/** Ventilation advice and purifier sizing side by side. */
export function GuidanceCards({ plan }: { plan: IndoorPlan }) {
  const { ventilation_advice: ventilation, purifier_guidance: purifier } = plan;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Ventilation advice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="font-semibold">{ventilation.action}</p>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Why: </span>
            {ventilation.reason}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Air purifier guidance</CardTitle>
          {purifier.recommended_cadr_m3h && (
            <CardDescription>
              Suggested size: about <strong className="text-foreground">{purifier.recommended_cadr_m3h} m³/h</strong> CADR for your main
              room
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{purifier.note}</CardContent>
      </Card>
    </div>
  );
}
