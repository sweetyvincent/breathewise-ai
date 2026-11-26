import { Bot, Cpu, FlaskConical, Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DataSource } from '@/lib/types';

export function DataBadge({ source, className }: { source: DataSource; className?: string }) {
  return source === 'live' ? (
    <Badge variant="live" className={className}>
      <Radio className="size-3" aria-hidden="true" />
      Live data
    </Badge>
  ) : (
    <Badge variant="simulated" className={className}>
      <FlaskConical className="size-3" aria-hidden="true" />
      Simulated demo data
    </Badge>
  );
}

export function EngineBadge({ generatedBy, fallbackReason }: { generatedBy: 'openai' | 'rules'; fallbackReason?: string | null }) {
  if (generatedBy === 'openai')
    return (
      <Badge variant="outline">
        <Bot className="size-3" aria-hidden="true" />
        AI-generated · validated
      </Badge>
    );
  const why =
    fallbackReason === 'no_api_key'
      ? 'AI key not configured'
      : fallbackReason
        ? 'AI output did not pass safety checks, so the rules engine answered'
        : '';
  return (
    <Badge variant="outline" title={why || undefined}>
      <Cpu className="size-3" aria-hidden="true" />
      Smart rules engine{why ? ` · ${why}` : ''}
    </Badge>
  );
}
