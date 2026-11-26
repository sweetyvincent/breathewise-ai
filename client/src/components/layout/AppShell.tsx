/** App frame for signed-in pages: skip link, sidebar and mobile navigation, header and the routed page. */
import {
  BookOpen,
  Bot,
  CalendarClock,
  Gauge,
  Home,
  Leaf,
  LogIn,
  LogOut,
  Menu,
  Route,
  Settings,
  Users,
  X,
  FlaskConical,
  Wind,
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Alert } from '@/components/ui/feedback';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useLocationCtx } from '@/context/LocationContext';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: Gauge, end: true },
  { to: '/app/planner', label: 'Daily Planner', icon: CalendarClock },
  { to: '/app/indoor', label: 'Indoor Air', icon: Home },
  { to: '/app/mobility', label: 'Mobility', icon: Route },
  { to: '/app/chat', label: 'BreatheBot', icon: Bot },
  { to: '/app/impact', label: 'Impact Tracker', icon: Leaf },
  { to: '/app/community', label: 'Community', icon: Users },
  { to: '/app/learn', label: 'Learn & Discover', icon: BookOpen },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn('flex items-center gap-2 font-bold text-forest-900', className)} aria-label="BreatheWise AI home">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
        <Wind className="size-5" aria-hidden="true" />
      </span>
      <span>
        BreatheWise <span className="text-emerald-700">AI</span>
      </span>
    </Link>
  );
}

function ModeBanner() {
  const { mode, modeError, effectiveDemo } = useLocationCtx();
  if (modeError)
    return (
      <Alert tone="danger" title="The server is not reachable" className="m-4">
        Start the API (see README) or check VITE_API_URL. Pages will show errors until it is available.
      </Alert>
    );
  if (!mode) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b bg-mint-50 px-4 py-2 text-xs text-forest-800">
      {effectiveDemo && (
        <span className="inline-flex items-center gap-1 font-semibold">
          <FlaskConical className="size-3.5" aria-hidden="true" />
          Demo mode: air-quality values are simulated, not live.
        </span>
      )}
      {!effectiveDemo && <span className="font-semibold">Live air-quality data</span>}
      <span>AI: {mode.ai === 'openai' ? 'OpenAI with validated output' : 'built-in rules engine (no API key set)'}</span>
    </div>
  );
}

export function AppShell() {
  // The mobile menu closes on navigation by remembering which path opened it (no effect needed).
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const { isAuthed, isDemo, email, signOut } = useAuth();
  const loc = useLocation();

  const open = openedAt === loc.pathname;
  const setOpen = (next: boolean | ((o: boolean) => boolean)) =>
    setOpenedAt((next instanceof Function ? next(open) : next) ? loc.pathname : null);

  const nav = (
    <nav id="primary-nav" aria-label="Primary" className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
              isActive ? 'bg-primary text-primary-foreground' : 'text-forest-800 hover:bg-secondary',
            )
          }
        >
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <a href="#main" className="sr-only-focusable absolute left-2 top-2 z-50 rounded-lg bg-primary px-4 py-2 text-white">
        Skip to main content
      </a>

      <aside className="hidden border-r bg-card p-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between">
        <div className="space-y-6">
          <Logo className="px-1" />
          {nav}
        </div>
        <AccountBlock isAuthed={isAuthed} isDemo={isDemo} email={email} signOut={signOut} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card/95 px-4 py-2 backdrop-blur lg:hidden">
          <Logo />
          <Button
            variant="outline"
            size="icon"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </header>
        {open && (
          <div id="mobile-nav" className="border-b bg-card p-4 lg:hidden">
            {nav}
            <div className="mt-4 border-t pt-4">
              <AccountBlock isAuthed={isAuthed} isDemo={isDemo} email={email} signOut={signOut} />
            </div>
          </div>
        )}
        <ModeBanner />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
        <footer className="border-t bg-card px-4 py-4 text-xs text-muted-foreground sm:px-8">
          BreatheWise AI gives general information, not medical advice. In poor air, follow official local health and pollution advisories.
          Emission and impact figures are estimates.
        </footer>
      </div>
    </div>
  );
}

function AccountBlock({
  isAuthed,
  isDemo,
  email,
  signOut,
}: {
  isAuthed: boolean;
  isDemo: boolean;
  email: string | null;
  signOut: () => Promise<void>;
}) {
  if (!isAuthed)
    return (
      <Button variant="outline" className="w-full" asChild>
        <Link to="/auth">
          <LogIn />
          Sign in / demo
        </Link>
      </Button>
    );
  return (
    <div className="space-y-2 text-sm">
      <p className="truncate text-muted-foreground">{isDemo ? 'Demo session (private to this tab)' : email}</p>
      <Button variant="outline" className="w-full" onClick={() => void signOut()}>
        <LogOut />
        Sign out
      </Button>
    </div>
  );
}
