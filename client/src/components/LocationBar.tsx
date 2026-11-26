import { LocateFixed, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label, Switch } from '@/components/ui/form';
import { useLocationCtx } from '@/context/LocationContext';
import { ExampleLocations } from './location/ExampleLocations';
import { SearchResults } from './location/SearchResults';
import { useLocationSearch } from './location/useLocationSearch';

interface LocationBarProps {
  onRefresh?: () => void;
  refreshing?: boolean;
}

/** Location controls shared by the data pages: search, geolocation, example cities, refresh and demo-data switch. */
export function LocationBar({ onRefresh, refreshing }: LocationBarProps) {
  const { location, forceDemo, setForceDemo, mode } = useLocationCtx();
  const { query, setQuery, results, presets, status, busy, search, choose, locate } = useLocationSearch();

  return (
    <section aria-label="Location" className="mb-6 rounded-lg border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-end gap-3">
        <form onSubmit={search} className="flex min-w-[220px] flex-1 items-end gap-2" role="search">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="loc-search">Search a city or area</Label>
            <Input
              id="loc-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Delhi, Lucknow, Pune"
              autoComplete="off"
              aria-describedby="loc-status"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={busy}>
            <Search />
            Search
          </Button>
        </form>
        <Button variant="outline" onClick={locate}>
          <LocateFixed />
          Use my location
        </Button>
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh} disabled={refreshing} aria-label="Refresh air quality">
            <RefreshCw className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </Button>
        )}
      </div>

      <p id="loc-status" role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-muted-foreground">
        {status}
      </p>

      <SearchResults results={results} onChoose={choose} />
      <ExampleLocations presets={presets} selectedName={location.name} onChoose={choose} />

      {mode?.airQuality === 'live' && (
        <div className="mt-3 flex items-center gap-2">
          <Switch id="force-demo" checked={forceDemo} onCheckedChange={setForceDemo} />
          <Label htmlFor="force-demo" className="font-normal">
            Use simulated demo data instead of live data
          </Label>
        </div>
      )}
    </section>
  );
}
