/** Sign in, sign up and the one-click demo session. */
import { FlaskConical } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, Spinner } from '@/components/ui/feedback';
import { Field, Input } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { useLocationCtx } from '@/context/LocationContext';

function CredentialsForm({ mode }: { mode: 'login' | 'signup' }) {
  const { signIn, signUp, supabaseEnabled } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    if (mode === 'login') {
      const err = await signIn(email, password);
      if (err) setError(err);
      else nav('/app');
    } else {
      const { error: err, needsConfirmation } = await signUp(email, password);
      if (err) setError(err);
      else if (needsConfirmation)
        setInfo('Check your email to confirm your account, then log in. You can set up your profile afterwards in Settings.');
      else nav('/app/settings?welcome=1'); // profile setup
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate={false}>
      {!supabaseEnabled && (
        <Alert tone="warning" title="Accounts are not configured on this deployment">
          Set the Supabase variables (see the README) to enable sign-up. Meanwhile use the demo session below.
        </Alert>
      )}
      <Field id={`${mode}-email`} label="Email">
        <Input id={`${mode}-email`} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field id={`${mode}-pw`} label="Password" hint={mode === 'signup' ? 'At least 8 characters.' : undefined}>
        <Input
          id={`${mode}-pw`}
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby={mode === 'signup' ? `${mode}-pw-hint` : undefined}
        />
      </Field>
      <div aria-live="polite">
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        {info && <p className="text-sm font-medium text-emerald-800">{info}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={busy || !supabaseEnabled}>
        {mode === 'login' ? 'Log in' : 'Create account'}
      </Button>
      {busy && <Spinner />}
    </form>
  );
}

export default function Auth() {
  const { startDemo, isAuthed, isDemo, email } = useAuth();
  const { mode } = useLocationCtx();
  const nav = useNavigate();
  const demoAllowed = mode?.demoLoginEnabled !== false;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
      <Logo />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to BreatheWise</CardTitle>
          <CardDescription>Sign in to save your profile, impact history and settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isAuthed && (
            <Alert tone="success" title="You are signed in">
              {isDemo ? 'Demo session active.' : email}{' '}
              <Link to="/app" className="font-semibold underline">
                Go to the app
              </Link>
            </Alert>
          )}
          <Tabs defaultValue="login">
            <TabsList aria-label="Account">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <CredentialsForm mode="login" />
            </TabsContent>
            <TabsContent value="signup">
              <CredentialsForm mode="signup" />
            </TabsContent>
          </Tabs>
          <div className="border-t pt-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <FlaskConical className="size-4 text-amber-800" aria-hidden="true" />
              Just exploring? (for judges and testers)
            </p>
            <Button
              variant="accent"
              className="w-full"
              disabled={!demoAllowed}
              onClick={() => {
                startDemo();
                nav('/app');
              }}
            >
              Continue as demo user
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              {demoAllowed
                ? 'Creates a private, temporary session in this browser tab. No email or password. Data is not shared with anyone.'
                : 'Demo login is disabled on this deployment.'}
            </p>
          </div>
        </CardContent>
      </Card>
      <Link to="/" className="text-sm text-primary underline">
        Back to home
      </Link>
    </div>
  );
}
