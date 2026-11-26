import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GeoPoint } from '@/lib/types';

interface SearchResultsProps {
  results: GeoPoint[];
  onChoose: (place: GeoPoint) => void;
}

/** Places returned by a search, as a keyboard-friendly list of buttons. */
export function SearchResults({ results, onChoose }: SearchResultsProps) {
  if (results.length === 0) return null;
  return (
    <ul className="mt-1 grid gap-1 sm:grid-cols-2" aria-label="Search results">
      {results.map((place) => (
        <li key={`${place.lat},${place.lon}`}>
          <Button variant="ghost" className="w-full justify-start" onClick={() => onChoose(place)}>
            <MapPin />
            {place.name}
          </Button>
        </li>
      ))}
    </ul>
  );
}
