import { useState, type FormEvent } from 'react';
import { OptionSelect } from '@/components/OptionSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/feedback';
import { CheckboxItem, Field, Input } from '@/components/ui/form';
import { MODE_OPTIONS } from '@/lib/options';
import type { ModeId } from '@/lib/types';

const PLACE_NAME_MAX_LENGTH = 80;
const DEFAULT_DISTANCE_KM = 8;
const DEFAULT_TRIPS_PER_WEEK = 10;
const DISTANCE_LIMITS = { min: 0.1, max: 500, step: 0.1 } as const;
const TRIPS_LIMITS = { min: 1, max: 30 } as const;

export interface TripFormValues {
  origin: string;
  destination: string;
  distanceKm: number;
  preferredMode: ModeId;
  tripsPerWeek: number;
  sensitive: boolean;
  travellingWithChildrenOrElderly: boolean;
}

interface MobilityFormProps {
  loading: boolean;
  onSubmit: (values: TripFormValues) => void;
}

/** Collects the trip. Owns the field state so the page only deals with submitted values and results. */
export function MobilityForm({ loading, onSubmit }: MobilityFormProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [distance, setDistance] = useState(DEFAULT_DISTANCE_KM);
  const [mode, setMode] = useState<ModeId>('car_petrol');
  const [trips, setTrips] = useState(DEFAULT_TRIPS_PER_WEEK);
  const [sensitive, setSensitive] = useState(false);
  const [vulnerable, setVulnerable] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      origin,
      destination,
      distanceKm: distance,
      preferredMode: mode,
      tripsPerWeek: trips,
      sensitive,
      travellingWithChildrenOrElderly: vulnerable,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your trip</CardTitle>
          <CardDescription>Distance is for one way. Place names are optional and are not sent to any map service.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="origin" label="Starting point (optional)">
            <Input
              id="origin"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              maxLength={PLACE_NAME_MAX_LENGTH}
              placeholder="e.g. Home, Sector 21"
            />
          </Field>
          <Field id="dest" label="Destination (optional)">
            <Input
              id="dest"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              maxLength={PLACE_NAME_MAX_LENGTH}
              placeholder="e.g. Office, campus"
            />
          </Field>
          <Field id="dist" label="Travel distance (km, one way)">
            <Input
              id="dist"
              type="number"
              {...DISTANCE_LIMITS}
              required
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
            />
          </Field>
          <OptionSelect
            id="mode"
            label="Your usual / preferred way to travel"
            value={mode}
            onChange={(v) => setMode(v as ModeId)}
            options={MODE_OPTIONS}
          />
          <Field id="trips" label="One-way trips per week">
            <Input id="trips" type="number" {...TRIPS_LIMITS} required value={trips} onChange={(e) => setTrips(Number(e.target.value))} />
          </Field>
          <div className="space-y-2 sm:col-span-2">
            <CheckboxItem id="m-sens" checked={sensitive} onChange={setSensitive}>
              I have a breathing or heart sensitivity
            </CheckboxItem>
            <CheckboxItem id="m-vul" checked={vulnerable} onChange={setVulnerable}>
              Travelling with children or older adults
            </CheckboxItem>
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={loading}>
          Compare options
        </Button>
        {loading && <Spinner label="Comparing…" />}
      </div>
    </form>
  );
}
