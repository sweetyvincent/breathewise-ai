/** Feedback primitives: alerts, loading skeletons and spinner, and the retryable error state. */
import { AlertTriangle, Info, Loader2 } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export const Skeleton = ({ className }: { className?: string }) => (
  <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-muted', className)} />
);

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      {label}
    </span>
  );
}

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const tones = {
    info: 'border-sky-800/30 bg-sky-50 text-sky-950',
    warning: 'border-amber-800/40 bg-amber-50 text-amber-950',
    danger: 'border-red-800/40 bg-red-50 text-red-950',
    success: 'border-emerald-800/30 bg-emerald-50 text-emerald-950',
  } as const;
  const Icon = tone === 'info' || tone === 'success' ? Info : AlertTriangle;
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-lg border p-4 text-sm', tones[tone], className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert tone="danger" title="Something went wrong">
      <p>{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" className="mt-2 bg-white" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Alert>
  );
}
