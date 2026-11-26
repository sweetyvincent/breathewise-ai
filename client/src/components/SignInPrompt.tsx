import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

/** Shown in place of features that store personal data when nobody is signed in. */
export function SignInPrompt({ feature }: { feature: string }) {
  const { startDemo, supabaseEnabled } = useAuth();
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <h2 className="text-lg font-semibold">Sign in to use {feature}</h2>
        <p className="text-sm text-muted-foreground">
          This feature saves data to your account. You can sign in{supabaseEnabled ? '' : ' (not configured here)'} or start a private demo
          session in one click; no email needed.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={startDemo}>Start demo session</Button>
          <Button variant="outline" asChild>
            <Link to="/auth">Sign in / Sign up</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
