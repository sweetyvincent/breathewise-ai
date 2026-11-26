/** Profile, location, notification and privacy settings. */
import { Settings as SettingsIcon } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { LocationBar } from '@/components/LocationBar';
import { OptionSelect } from '@/components/OptionSelect';
import { PageHeader } from '@/components/PageHeader';
import { SignInPrompt } from '@/components/SignInPrompt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, Spinner } from '@/components/ui/feedback';
import { Field, Input, Label, Switch } from '@/components/ui/form';
import { useAuth } from '@/context/AuthContext';
import { useLocationCtx } from '@/context/LocationContext';
import { ApiError, api } from '@/lib/api';
import { AGE_OPTIONS, COMMUTE_OPTIONS, OCCUPATION_OPTIONS, OUTDOOR_OPTIONS } from '@/lib/options';
import { clearLocalData, DEFAULT_PLAN_PROFILE, loadSavedProfile, saveProfileLocally } from '@/lib/profile';

export default function Settings() {
  const { isAuthed, signOut } = useAuth();
  const { location } = useLocationCtx();
  const [name, setName] = useState('');
  // Start from the locally saved profile (if any); the server profile then overrides it once loaded.
  const [initial] = useState(() => loadSavedProfile() ?? DEFAULT_PLAN_PROFILE);
  const [age, setAge] = useState<string>(initial.ageGroup);
  const [occ, setOcc] = useState<string>(initial.occupation);
  const [commute, setCommute] = useState<string>(initial.commute);
  const [outdoor, setOutdoor] = useState<string>(initial.outdoorFrequency);
  const [alerts, setAlerts] = useState(true);
  const [reminder, setReminder] = useState(false);
  const [saveChat, setSaveChat] = useState(true);
  const [saveAqi, setSaveAqi] = useState(true);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthed) return;
    api
      .getProfile()
      .then(({ profile }) => {
        setName(profile.name ?? '');
        if (profile.ageGroup) setAge(profile.ageGroup);
        if (profile.occupation) setOcc(profile.occupation);
        const p = profile.preferences;
        if (p.commute) setCommute(p.commute);
        if (p.outdoorFrequency) setOutdoor(p.outdoorFrequency);
        if (p.notifications) {
          setAlerts(p.notifications.highAqiAlerts);
          setReminder(p.notifications.dailyPlanReminder);
        }
        if (p.privacy) {
          setSaveChat(p.privacy.saveChatHistory);
          setSaveAqi(p.privacy.saveAqiHistory);
        }
      })
      .catch(() => setError('Could not load your saved profile.'));
  }, [isAuthed]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      const local = loadSavedProfile() ?? DEFAULT_PLAN_PROFILE;
      saveProfileLocally({
        ...local,
        ageGroup: age as typeof local.ageGroup,
        occupation: occ as typeof local.occupation,
        commute: commute as typeof local.commute,
        outdoorFrequency: outdoor as typeof local.outdoorFrequency,
      });
      await api.putProfile({
        name,
        ageGroup: age,
        occupation: occ,
        location,
        preferences: {
          commute,
          outdoorFrequency: outdoor,
          lifestyle: local.lifestyle,
          sensitivities: local.sensitivities,
          workHours: local.workHours,
          notifications: { highAqiAlerts: alerts, dailyPlanReminder: reminder },
          privacy: { saveChatHistory: saveChat, saveAqiHistory: saveAqi },
        },
      });
      setMsg('Settings saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.friendly : 'Could not save settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your profile, default location, notifications and privacy controls."
        icon={<SettingsIcon className="size-5" />}
      />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Location preference</CardTitle>
          <CardDescription>
            Saved as your default and used across the app. Saved on this device and, when you save below, in your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocationBar />
        </CardContent>
      </Card>

      {!isAuthed ? (
        <SignInPrompt feature="profile, notification and privacy settings" />
      ) : (
        <form onSubmit={save} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field id="s-name" label="Display name" className="sm:col-span-2">
                <Input id="s-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
              </Field>
              <OptionSelect id="s-age" label="Age group" value={age} onChange={setAge} options={AGE_OPTIONS} />
              <OptionSelect id="s-occ" label="Occupation" value={occ} onChange={setOcc} options={OCCUPATION_OPTIONS} />
              <OptionSelect id="s-commute" label="Usual commute" value={commute} onChange={setCommute} options={COMMUTE_OPTIONS} />
              <OptionSelect id="s-out" label="Outdoor activity" value={outdoor} onChange={setOutdoor} options={OUTDOOR_OPTIONS} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Preferences are saved to your profile. In this version they control in-app alerts only; push and email delivery are not
                enabled.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleRow id="n-alerts" label="Show high-AQI health alerts" checked={alerts} onChange={setAlerts} />
              <ToggleRow id="n-remind" label="Daily plan reminder (preference only)" checked={reminder} onChange={setReminder} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy controls</CardTitle>
              <CardDescription>You decide what is stored with your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleRow id="p-chat" label="Save my BreatheBot conversations to my account" checked={saveChat} onChange={setSaveChat} />
              <ToggleRow id="p-aqi" label="Save my air-quality history to my account" checked={saveAqi} onChange={setSaveAqi} />
              <p className="text-xs text-muted-foreground">
                Health sensitivities you choose in the planner are voluntary and stay in this browser unless you save them here. Community
                reports never show your exact location.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  clearLocalData();
                  setMsg('Local data on this device was cleared.');
                }}
              >
                Clear data stored on this device
              </Button>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg" disabled={loading}>
              Save settings
            </Button>
            <Button type="button" variant="ghost" onClick={() => void signOut()}>
              Sign out
            </Button>
            {loading && <Spinner label="Saving…" />}
          </div>
          <div aria-live="polite">
            {msg && <Alert tone="success">{msg}</Alert>}
            {error && <Alert tone="danger">{error}</Alert>}
          </div>
        </form>
      )}
    </>
  );
}

function ToggleRow({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id} className="text-sm font-normal">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
