import { Button } from '@/components/ui/button';
import type { GeoPoint } from '@/lib/types';

interface ExampleLocationsProps {
  presets: GeoPoint[];
  selectedName: string;
  onChoose: (place: GeoPoint) => void;
}

/** One-tap example cities; the current one is marked with `aria-pressed`. */
export function ExampleLocations({ presets, selectedName, onChoose }: ExampleLocationsProps) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Example locations:</span>
      {presets.map((place) => (
        <Button
          key={place.name}
          size="sm"
          variant={place.name === selectedName ? 'default' : 'outline'}
          onClick={() => onChoose(place)}
          aria-pressed={place.name === selectedName}
        >
          {place.name.split(',')[0]}
        </Button>
      ))}
    </div>
  );
}
