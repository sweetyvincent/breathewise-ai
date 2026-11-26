import { Wind } from 'lucide-react';
import type { FormEvent } from 'react';
import { OptionSelect } from '@/components/OptionSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/feedback';
import { CheckboxItem, Field, Input } from '@/components/ui/form';
import { BUDGET_OPTIONS, VENTILATION_OPTIONS } from '@/lib/options';
import type { HomeProfile } from '@/lib/types';

type BooleanHomeKey = {
  [K in keyof HomeProfile]: HomeProfile[K] extends boolean ? K : never;
}[keyof HomeProfile];

/** Household factors that change the advice; ids are stable because tests and labels depend on them. */
const HOUSEHOLD_FLAGS: Array<{ id: string; key: BooleanHomeKey; label: string }> = [
  { id: 'h-kids', key: 'hasChildren', label: 'Children live here' },
  { id: 'h-eld', key: 'hasElderly', label: 'Older adults live here' },
  { id: 'h-pets', key: 'hasPets', label: 'We have pets' },
  { id: 'h-ac', key: 'hasAirConditioner', label: 'We have an air conditioner' },
  { id: 'h-cook', key: 'cooksIndoors', label: 'We cook indoors daily' },
  { id: 'h-inc', key: 'usesIncenseOrCandles', label: 'We burn incense / candles / coils' },
  { id: 'h-smoke', key: 'smokersInHome', label: 'Someone smokes indoors' },
];

interface HomeFormProps {
  home: HomeProfile;
  loading: boolean;
  onChange: <K extends keyof HomeProfile>(key: K, value: HomeProfile[K]) => void;
  onSubmit: (e: FormEvent) => void;
}

export function HomeForm({ home, loading, onChange, onSubmit }: HomeFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your home</CardTitle>
          <CardDescription>Used to size a purifier and prioritise advice.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field id="size" label="Home size (m²)" hint="1 m² ≈ 10.8 sq ft">
            <Input
              id="size"
              type="number"
              min={10}
              max={1000}
              required
              value={home.sizeSqm}
              onChange={(e) => onChange('sizeSqm', Number(e.target.value))}
              aria-describedby="size-hint"
            />
          </Field>
          <Field id="rooms" label="Number of rooms">
            <Input
              id="rooms"
              type="number"
              min={1}
              max={20}
              required
              value={home.rooms}
              onChange={(e) => onChange('rooms', Number(e.target.value))}
            />
          </Field>
          <OptionSelect
            id="budget"
            label="Budget"
            value={home.budget}
            onChange={(v) => onChange('budget', v as HomeProfile['budget'])}
            options={BUDGET_OPTIONS}
          />
          <OptionSelect
            id="vent"
            label="Natural ventilation"
            value={home.ventilation}
            onChange={(v) => onChange('ventilation', v as HomeProfile['ventilation'])}
            options={VENTILATION_OPTIONS}
          />
        </CardContent>
        <CardContent>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Who and what is at home?</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {HOUSEHOLD_FLAGS.map(({ id, key, label }) => (
                <CheckboxItem key={id} id={id} checked={home[key]} onChange={(v) => onChange(key, v)}>
                  {label}
                </CheckboxItem>
              ))}
            </div>
          </fieldset>
        </CardContent>
      </Card>
      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={loading}>
          <Wind />
          Get indoor recommendations
        </Button>
        {loading && <Spinner label="Working it out…" />}
      </div>
    </form>
  );
}
