import { ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { OptionSelect } from '@/components/OptionSelect';
import { ErrorState, Skeleton } from '@/components/ui/feedback';
import { REPORT_TYPE_OPTIONS } from '@/lib/options';
import type { CommunityReport } from '@/lib/types';
import { ReportList } from './ReportList';

const ALL_REPORTS = 'all';

interface ReportsSectionProps {
  reports: CommunityReport[] | undefined;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

/** Filterable list of community reports with the "unverified" notice always visible. */
export function ReportsSection({ reports, loading, error, onRetry }: ReportsSectionProps) {
  const [filter, setFilter] = useState(ALL_REPORTS);
  const shown = reports?.filter((r) => filter === ALL_REPORTS || r.type === filter) ?? [];

  return (
    <section aria-labelledby="reports-h" className="space-y-4 lg:col-span-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="reports-h" className="text-xl font-bold">
          Community pollution reports
        </h2>
        <div className="w-56">
          <OptionSelect
            id="rfilter"
            label="Filter by type"
            value={filter}
            onChange={setFilter}
            options={[{ value: ALL_REPORTS, label: 'All reports' }, ...REPORT_TYPE_OPTIONS]}
          />
        </div>
      </div>
      <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Reports are submitted by community members and are <strong>unverified until reviewed</strong>. They are never shown with a precise
        home location.
      </p>

      {loading && !reports && <Skeleton className="h-40" />}
      {error && <ErrorState message={error} onRetry={onRetry} />}
      {reports && shown.length === 0 && <p className="text-sm text-muted-foreground">No reports match this filter yet.</p>}
      <ReportList reports={shown} />
    </section>
  );
}
