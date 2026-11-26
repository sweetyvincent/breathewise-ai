import { Info } from 'lucide-react';
import { DataBadge, EngineBadge } from '@/components/DataBadge';
import type { AiMeta } from '@/lib/types';
import { timeAgo } from '@/lib/utils';

/** Shows exactly what an AI answer was based on: source, scale, observation time. */
export function DataQualityNote({ meta }: { meta: AiMeta }) {
  const q = meta.dataQuality;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
      <EngineBadge generatedBy={meta.generatedBy} fallbackReason={meta.fallbackReason} />
      <DataBadge source={q.source} />
      <span className="inline-flex items-center gap-1">
        <Info className="size-3" aria-hidden="true" />
        Based on AQI {q.aqi} ({q.category}) for {q.location}, observed {timeAgo(q.observedAt)} · {q.scale}
      </span>
    </div>
  );
}
