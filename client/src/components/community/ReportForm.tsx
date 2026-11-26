import { useState, type FormEvent } from 'react';
import { OptionSelect } from '@/components/OptionSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { CheckboxItem, Field, Input, Textarea } from '@/components/ui/form';
import { useLocationCtx } from '@/context/LocationContext';
import { ApiError, api } from '@/lib/api';
import { REPORT_TYPE_OPTIONS } from '@/lib/options';

/** Submits a report. Position is optional and the server rounds it to ~1 km before storing. */
export function ReportForm({ onDone }: { onDone: () => void }) {
  const { location } = useLocationCtx();
  const [type, setType] = useState('garbage_burning');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState('');
  const [attach, setAttach] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.submitReport({
        type,
        description,
        areaLabel: area,
        ...(attach ? { lat: location.lat, lon: location.lon } : {}),
      });
      setMessage(res.message);
      setDescription('');
      setArea('');
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.friendly : 'Could not submit your report.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <Card>
        <CardHeader>
          <CardDescription>Describe what you saw. Please don’t include house numbers, names or anything personal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <OptionSelect id="r-type" label="What did you see?" value={type} onChange={setType} options={REPORT_TYPE_OPTIONS} />
          <Field id="r-desc" label="Description" hint="At least 10 characters.">
            <Textarea
              id="r-desc"
              required
              minLength={10}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-describedby="r-desc-hint"
            />
          </Field>
          <Field
            id="r-area"
            label="Neighbourhood / area"
            hint="A general area such as “Sector 21” or “Old Market Road”, not your home address."
          >
            <Input
              id="r-area"
              required
              minLength={2}
              maxLength={80}
              value={area}
              onChange={(e) => setArea(e.target.value)}
              aria-describedby="r-area-hint"
            />
          </Field>
          <CheckboxItem id="r-attach" checked={attach} onChange={setAttach}>
            Attach approximate map position (rounded to ~1 km; never exact)
          </CheckboxItem>
          <Button type="submit" disabled={busy} className="w-full">
            Submit report
          </Button>
          <div aria-live="polite">
            {message && <p className="text-sm font-medium text-emerald-800">{message}</p>}
            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Reports are labelled <em>user-submitted · unverified</em> until reviewed. For emergencies, contact local authorities.
          </p>
        </CardContent>
      </Card>
    </form>
  );
}
