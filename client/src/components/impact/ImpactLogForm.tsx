import { Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { OptionSelect } from '@/components/OptionSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/feedback';
import { Field, Input, Select } from '@/components/ui/form';
import { ACTIVITY_OPTIONS } from '@/lib/options';
import type { ActivityInput, ActivityType } from '@/lib/types';
import { HABIT_TYPE, SAMPLE_WEEK, WHEN_OPTIONS } from './sampleData';

interface ImpactLogFormProps {
  busy: boolean;
  message: string | null;
  error: string | null;
  /** Saves activities and reports the outcome through `message` / `error`. */
  onLog: (activities: ActivityInput[], successMessage: string) => Promise<void>;
}

/** Form for logging one action, plus a one-click sample-data loader for demos. */
export function ImpactLogForm({ busy, message, error, onLog }: ImpactLogFormProps) {
  const [type, setType] = useState<ActivityType>('metro');
  const [km, setKm] = useState(10);
  const [count, setCount] = useState(1);
  const [when, setWhen] = useState('0');
  const isHabit = type === HABIT_TYPE;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void onLog([{ type, distanceKm: isHabit ? 0 : km, count, daysAgo: Number(when) }], 'Logged.');
  };

  return (
    <form onSubmit={submit} className="lg:col-span-1">
      <Card>
        <CardHeader>
          <CardTitle>Log an action</CardTitle>
          <CardDescription>Compared with driving a petrol car alone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <OptionSelect
            id="act"
            label="What did you do?"
            value={type}
            onChange={(v) => setType(v as ActivityType)}
            options={ACTIVITY_OPTIONS}
          />
          {!isHabit && (
            <Field id="act-km" label="Distance per trip (km)">
              <Input
                id="act-km"
                type="number"
                min={0.1}
                max={500}
                step={0.1}
                value={km}
                onChange={(e) => setKm(Number(e.target.value))}
                required
              />
            </Field>
          )}
          <Field id="act-n" label={isHabit ? 'How many habits' : 'Number of trips'}>
            <Input id="act-n" type="number" min={1} max={50} value={count} onChange={(e) => setCount(Number(e.target.value))} required />
          </Field>
          <Field id="act-when" label="When">
            <Select id="act-when" value={when} onChange={(e) => setWhen(e.target.value)}>
              {WHEN_OPTIONS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" disabled={busy} className="w-full">
            Add to my impact
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            className="w-full"
            onClick={() => void onLog(SAMPLE_WEEK, 'Sample data loaded.')}
          >
            <Sparkles />
            Load sample data (demo)
          </Button>
          {busy && <Spinner label="Saving…" />}
          <div aria-live="polite">
            {message && <p className="text-sm font-medium text-emerald-800">{message}</p>}
            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
