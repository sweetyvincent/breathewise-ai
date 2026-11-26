import { Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { OptionSelect } from '@/components/OptionSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/feedback';
import { CheckboxItem, Field, Input } from '@/components/ui/form';
import { AGE_OPTIONS, COMMUTE_OPTIONS, LIFESTYLE_OPTIONS, OCCUPATION_OPTIONS, OUTDOOR_OPTIONS, SENSITIVITY_OPTIONS } from '@/lib/options';
import { DEFAULT_PLAN_PROFILE, loadSavedProfile } from '@/lib/profile';
import type { PlanProfile } from '@/lib/types';

/** Adds or removes a value without ever producing duplicates. */
const toggle = (list: string[], value: string, on: boolean) => (on ? [...new Set([...list, value])] : list.filter((x) => x !== value));

interface PlannerFormProps {
  locationName: string;
  loading: boolean;
  onSubmit: (profile: PlanProfile) => void;
}

/** Profile questions. Starts from the saved profile (if any) and owns the draft until it is submitted. */
export function PlannerForm({ locationName, loading, onSubmit }: PlannerFormProps) {
  const [profile, setProfile] = useState<PlanProfile>(() => loadSavedProfile() ?? DEFAULT_PLAN_PROFILE);
  const set = <K extends keyof PlanProfile>(k: K, v: PlanProfile[K]) => setProfile((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(profile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-describedby="planner-note">
      <Card>
        <CardHeader>
          <CardTitle>About you</CardTitle>
          <CardDescription id="planner-note">
            Used only to tailor advice for {locationName}. Nothing here is a medical assessment.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <OptionSelect
            id="age"
            label="Age group"
            value={profile.ageGroup}
            onChange={(v) => set('ageGroup', v as PlanProfile['ageGroup'])}
            options={AGE_OPTIONS}
          />
          <OptionSelect
            id="occ"
            label="Occupation"
            value={profile.occupation}
            onChange={(v) => set('occupation', v as PlanProfile['occupation'])}
            options={OCCUPATION_OPTIONS}
          />
          <OptionSelect
            id="commute"
            label="Daily commute"
            value={profile.commute}
            onChange={(v) => set('commute', v as PlanProfile['commute'])}
            options={COMMUTE_OPTIONS}
          />
          <OptionSelect
            id="outdoor"
            label="Outdoor activity"
            value={profile.outdoorFrequency}
            onChange={(v) => set('outdoorFrequency', v as PlanProfile['outdoorFrequency'])}
            options={OUTDOOR_OPTIONS}
          />
          <Field id="wh-start" label="Work / school starts">
            <Input
              id="wh-start"
              type="time"
              value={profile.workHours.start}
              onChange={(e) => set('workHours', { ...profile.workHours, start: e.target.value })}
              required
            />
          </Field>
          <Field id="wh-end" label="Work / school ends">
            <Input
              id="wh-end"
              type="time"
              value={profile.workHours.end}
              onChange={(e) => set('workHours', { ...profile.workHours, end: e.target.value })}
              required
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lifestyle preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckboxGroup
            legend="Lifestyle preferences"
            idPrefix="ls"
            options={LIFESTYLE_OPTIONS}
            selected={profile.lifestyle}
            onChange={(next) => set('lifestyle', next)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Health sensitivities <span className="font-normal text-muted-foreground">(optional)</span>
          </CardTitle>
          <CardDescription>
            Voluntary. Selecting these only makes the advice more cautious; leave blank if you prefer. This is never shared.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CheckboxGroup
            legend="Health sensitivities (optional)"
            idPrefix="sens"
            options={SENSITIVITY_OPTIONS}
            selected={profile.sensitivities}
            onChange={(next) => set('sensitivities', next)}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={loading}>
          <Sparkles />
          Generate My Daily Plan
        </Button>
        {loading && <Spinner label="Building your plan…" />}
      </div>
    </form>
  );
}

interface CheckboxGroupProps {
  /** Visually hidden group name for screen readers. */
  legend: string;
  idPrefix: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  selected: string[];
  onChange: (next: string[]) => void;
}

function CheckboxGroup({ legend, idPrefix, options, selected, onChange }: CheckboxGroupProps) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((o) => (
          <CheckboxItem
            key={o.value}
            id={`${idPrefix}-${o.value}`}
            checked={selected.includes(o.value)}
            onChange={(checked) => onChange(toggle(selected, o.value, checked))}
          >
            {o.label}
          </CheckboxItem>
        ))}
      </div>
    </fieldset>
  );
}
