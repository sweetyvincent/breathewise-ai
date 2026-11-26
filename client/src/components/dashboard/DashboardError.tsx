import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/feedback';

interface DashboardErrorProps {
  message: string;
  onRetry: () => void;
  /** When live data is configured but failing, offer an explicit, labelled switch to simulated data. */
  offerDemo: boolean;
  onUseDemo: () => void;
}

/** Failure state. Live data is never silently replaced by simulated data. */
export function DashboardError({ message, onRetry, offerDemo, onUseDemo }: DashboardErrorProps) {
  return (
    <div className="space-y-3">
      <ErrorState message={message} onRetry={onRetry} />
      {offerDemo && (
        <Button variant="secondary" onClick={onUseDemo}>
          Show clearly-labelled simulated demo data instead
        </Button>
      )}
    </div>
  );
}
