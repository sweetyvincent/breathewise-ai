/** Public landing page: value proposition, features, how it works and calls to action. */
import { ArrowRight, BookOpen, Bot, CalendarClock, Gauge, Home, Leaf, Route, ShieldCheck, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

const FEATURES = [
  {
    icon: Gauge,
    title: 'Smart AQI dashboard',
    text: 'Live AQI, pollutants, weather, a 24-hour trend and 7-day history, with a plain-language health message.',
  },
  {
    icon: CalendarClock,
    title: 'AI daily planner',
    text: 'A routine for your commute, age and lifestyle, with the reason behind each step.',
  },
  { icon: Home, title: 'Breathe better indoors', text: 'Free, low-budget and advanced fixes sized to your home, plus myths vs. evidence.' },
  {
    icon: Route,
    title: 'Sustainable mobility',
    text: 'Compare options by emissions and exposure. Greenest isn’t always healthiest in smog.',
  },
  { icon: Bot, title: 'BreatheBot', text: 'Ask anything: “Is it safe to go outside?” Answers use real data and never invent readings.' },
  { icon: Leaf, title: 'Impact tracker', text: 'See estimated CO₂ and fuel avoided, with every assumption shown.' },
  { icon: Users, title: 'Community hub', text: 'Report pollution sources (clearly unverified), join challenges, act locally.' },
  { icon: BookOpen, title: 'Learn & discover', text: 'AQI, PM2.5, winter smog and health, explained simply.' },
];

const STEPS = [
  {
    n: 1,
    title: 'Understand',
    text: 'We read the air near you, label what is live versus simulated, and explain what the numbers mean for your day.',
  },
  {
    n: 2,
    title: 'Recommend',
    text: 'A rules engine plus validated generative AI turns the data and your routine into practical, affordable actions, each with a “why”.',
  },
  { n: 3, title: 'Measure', text: 'Track the trips and habits that cut emissions, as honest estimates, not inflated claims.' },
];

export default function Landing() {
  const { startDemo, isAuthed } = useAuth();
  const nav = useNavigate();
  const tryDemo = () => {
    startDemo();
    nav('/app');
  };

  return (
    <div className="min-h-screen bg-background">
      <a href="#main" className="sr-only-focusable absolute left-2 top-2 z-50 rounded-lg bg-primary px-4 py-2 text-white">
        Skip to main content
      </a>
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="container flex items-center justify-between py-3">
          <Logo />
          <nav aria-label="Top" className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/app">Open app</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/auth">{isAuthed ? 'Account' : 'Sign in'}</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="bg-forest-900 text-white">
          <div className="container grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
            <div>
              <p className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                Urban air quality assistant
              </p>
              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Breathe smarter through smog season.</h1>
              <p className="mt-4 max-w-xl text-lg text-emerald-50/90">
                BreatheWise AI explains what today’s air means for your family, plans your day around it, and shows how small choices cut
                exposure and emissions.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" variant="accent" onClick={tryDemo}>
                  Try the live demo <ArrowRight />
                </Button>
                <Button size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10" asChild>
                  <Link to="/auth">Create account</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-emerald-100/80">
                No sign-up needed for the demo. Without API keys, air data is clearly labelled as simulated.
              </p>
            </div>
            <Card className="border-0 bg-white/95 text-foreground">
              <CardHeader>
                <CardTitle>Example: a smoggy winter morning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="rounded-lg bg-orange-50 p-3 font-medium text-orange-950">
                  <strong>AQI 258 · Poor.</strong> Sensitive individuals should reduce prolonged outdoor exertion. Consider indoor
                  activities and check local advisories.
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    <strong>Move exercise indoors.</strong> Harder breathing pulls in more particles.
                  </li>
                  <li>
                    <strong>Take metro, not a long walk.</strong> Exertion in smog raises the dose you breathe.
                  </li>
                  <li>
                    <strong>Run a right-sized HEPA purifier</strong> in the bedroom overnight.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section aria-labelledby="feat-h" className="container py-16">
          <h2 id="feat-h" className="text-3xl font-bold tracking-tight text-forest-900">
            Everything for cleaner, safer days
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <Card className="h-full">
                  <CardContent className="space-y-2 p-5">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary" aria-hidden="true">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="how-h" className="bg-mint-50 py-16">
          <div className="container">
            <h2 id="how-h" className="text-3xl font-bold tracking-tight text-forest-900">
              How it works
            </h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="rounded-lg border bg-card p-6 shadow-card">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary font-bold text-white" aria-hidden="true">
                    {s.n}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="trust-h" className="container py-16">
          <div className="flex flex-col items-start gap-4 rounded-lg border bg-card p-8 shadow-card md:flex-row md:items-center">
            <ShieldCheck className="size-10 shrink-0 text-emerald-700" aria-hidden="true" />
            <div>
              <h2 id="trust-h" className="text-xl font-bold">
                Built to be trustworthy
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Data is labelled live or simulated, with its scale and timestamp. AI output is validated and safety-screened. We never
                diagnose, never claim absolute safety, and always point you to official local advisories.
              </p>
            </div>
            <Button size="lg" className="md:ml-auto" onClick={tryDemo}>
              Start the demo
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card py-6 text-center text-xs text-muted-foreground">
        BreatheWise AI gives general information, not medical advice. Follow official local health advisories.
      </footer>
    </div>
  );
}
