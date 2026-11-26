import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { REPORT_TYPE_OPTIONS, labelOf } from '@/lib/options';
import type { CommunityReport } from '@/lib/types';
import { timeAgo } from '@/lib/utils';

/** Public report cards: always carry the server's verification label, never an exact location. */
export function ReportList({ reports }: { reports: CommunityReport[] }) {
  return (
    <ul className="space-y-3">
      {reports.map((r) => (
        <li key={r.id}>
          <Card>
            <CardContent className="p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="warning">{labelOf(REPORT_TYPE_OPTIONS, r.type)}</Badge>
                <Badge variant={r.status === 'verified' ? 'live' : 'outline'}>{r.statusLabel}</Badge>
                {r.sample && <Badge variant="simulated">Sample report</Badge>}
              </div>
              <p className="mt-2">{r.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Area: {r.area} · {timeAgo(r.createdAt)}
              </p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
