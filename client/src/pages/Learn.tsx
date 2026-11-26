import { BookOpen, Ban, CheckCircle2 } from 'lucide-react';
import { AqiLegend } from '@/components/AqiLegend';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/** Simple illustration: relative size of a human hair, PM10 and PM2.5 particles (not to exact scale). */
function ParticleSizes() {
  return (
    <svg
      viewBox="0 0 420 150"
      role="img"
      aria-label="Illustration comparing the width of a human hair (about 70 micrometres), PM10 (10 micrometres or smaller) and PM2.5 (2.5 micrometres or smaller). PM2.5 is about 28 times narrower than a hair."
      className="w-full max-w-[460px]"
    >
      <rect x="20" y="20" width="380" height="36" rx="18" fill="#E3F1E8" stroke="#14532D" strokeWidth="2" />
      <text x="210" y="43" textAnchor="middle" fontSize="13" fontWeight="600" fill="#14532D">
        Human hair · about 70 µm wide
      </text>
      <circle cx="90" cy="105" r="26" fill="#FEF9C3" stroke="#CA8A04" strokeWidth="2" />
      <text x="90" y="110" textAnchor="middle" fontSize="12" fontWeight="700" fill="#713F12">
        PM10
      </text>
      <text x="90" y="144" textAnchor="middle" fontSize="11" fill="#3F5247">
        ≤ 10 µm
      </text>
      <circle cx="210" cy="105" r="10" fill="#FEE2E2" stroke="#DC2626" strokeWidth="2" />
      <text x="210" y="80" textAnchor="middle" fontSize="12" fontWeight="700" fill="#7F1D1D">
        PM2.5
      </text>
      <text x="210" y="144" textAnchor="middle" fontSize="11" fill="#3F5247">
        ≤ 2.5 µm
      </text>
      <text x="320" y="110" textAnchor="middle" fontSize="11" fill="#3F5247">
        Illustrative sizes
      </text>
    </svg>
  );
}

const TOPICS = [
  {
    id: 'aqi',
    title: 'What is AQI?',
    body: (
      <>
        <p>
          The Air Quality Index turns the concentrations of several pollutants into one number from 0 to 500. Higher means more polluted.
          The index is set by the <em>worst</em> pollutant at the time, often PM2.5 in winter.
        </p>
        <div className="mt-3">
          <AqiLegend />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          BreatheWise uses India’s National AQI (CPCB) scale. Different countries use different scales, so a number from another scale is
          not directly comparable.
        </p>
      </>
    ),
  },
  {
    id: 'pm',
    title: 'What are PM2.5 and PM10?',
    body: (
      <>
        <p>
          PM stands for particulate matter: tiny solid or liquid particles floating in the air. PM10 are 10 micrometres or smaller (dust,
          pollen). PM2.5 are 2.5 micrometres or smaller (smoke, vehicle exhaust) and are small enough to travel deep into the lungs.
        </p>
        <div className="mt-3">
          <ParticleSizes />
        </div>
      </>
    ),
  },
  {
    id: 'smog',
    title: 'What causes winter smog?',
    body: (
      <>
        <p>
          In winter, cold, still air close to the ground acts like a lid (a temperature inversion), trapping pollution near where it is
          made. Sources include vehicle exhaust, burning of crop residue, waste and wood, construction dust, industry and cooking fuel. Low
          wind and high humidity make it linger and can form fog-smog mixes.
        </p>
      </>
    ),
  },
  {
    id: 'health',
    title: 'How does air pollution affect health?',
    body: (
      <>
        <p>
          Short-term exposure can irritate eyes, nose and throat and trigger coughing or breathlessness. Over time, polluted air is linked
          with higher risk of lung and heart problems. Children, older adults, pregnant people and people with asthma or heart conditions
          are more affected. This app gives general information, not diagnosis; talk to a doctor about personal concerns.
        </p>
      </>
    ),
  },
  {
    id: 'indoor',
    title: 'Indoor vs. outdoor pollution',
    body: (
      <>
        <p>
          Indoor air has its own sources: cooking, smoking, incense, candles, mosquito coils, dust and mould. With windows closed, indoor
          air is often (not always) cleaner than outdoors in a smog event, especially with a HEPA purifier. Ventilate when outdoor air is
          cleaner than indoor air; keep closed when it is not.
        </p>
      </>
    ),
  },
  {
    id: 'lifestyle',
    title: 'Sustainable lifestyle practices',
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Use metro, bus, carpool or electric options where practical.</li>
        <li>Combine errands and avoid idling.</li>
        <li>Never burn waste, leaves or wood.</li>
        <li>Choose cleaner cooking fuels and use exhaust when cooking.</li>
        <li>Cut energy use at home; most grids still burn fuel.</li>
      </ul>
    ),
  },
  {
    id: 'community',
    title: 'How communities can reduce pollution',
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Organise waste collection so nobody needs to burn it.</li>
        <li>Ask builders to control dust (covers, water sprinkling).</li>
        <li>Set up shared transport and safe cycling routes.</li>
        <li>Report visible pollution sources to local authorities.</li>
        <li>Protect trees and green spaces, alongside cutting emissions.</li>
      </ul>
    ),
  },
];

const MYTHS = [
  {
    myth: 'Indoor plants clean the air in my room.',
    fact: 'Not at normal room scale. You would need an impractical number of plants to rival a purifier. Plants are pleasant, but not a pollution fix.',
  },
  {
    myth: 'If I can’t see smog, the air is fine.',
    fact: 'Fine particles and gases can be harmful even when the sky looks clear. Check the AQI.',
  },
  {
    myth: 'A cloth or surgical mask protects me from PM2.5.',
    fact: 'They filter fine particles poorly. A well-fitted N95/FFP2/KN95-type respirator does much better, and only when sealed to the face and recommended by official guidance.',
  },
  { myth: 'Burning incense or candles purifies the air.', fact: 'They release particles and other pollutants and worsen indoor air.' },
  { myth: 'An air conditioner cleans the air.', fact: 'Cooling is not filtering. For fine particles, a HEPA purifier is the right tool.' },
  {
    myth: 'Exercising outdoors is always healthiest.',
    fact: 'When air is poor, harder breathing increases the pollution you inhale. Switch to indoor activity.',
  },
];

export default function Learn() {
  return (
    <>
      <PageHeader
        title="Learn & discover"
        description="Short, plain-language explainers about air pollution, health and what you can do."
        icon={<BookOpen className="size-5" />}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {TOPICS.map((t) => (
          <Card key={t.id} className={t.id === 'aqi' || t.id === 'pm' ? 'md:col-span-2' : ''}>
            <CardHeader>
              <CardTitle>{t.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed">{t.body}</CardContent>
          </Card>
        ))}
      </div>

      <section aria-labelledby="myth-h" className="mt-10">
        <h2 id="myth-h" className="mb-1 text-xl font-bold">
          Common air pollution myths
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">What people often believe, and what the evidence says.</p>
        <ul className="grid gap-3 md:grid-cols-2">
          {MYTHS.map((m) => (
            <li key={m.myth}>
              <Card className="h-full">
                <CardContent className="space-y-2 p-4 text-sm">
                  <p className="flex gap-2 font-semibold">
                    <Ban className="mt-0.5 size-4 shrink-0 text-red-800" aria-hidden="true" />
                    <span>
                      <span className="sr-only">Myth: </span>
                      {m.myth}
                    </span>
                  </p>
                  <p className="flex gap-2 text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" />
                    <span>
                      <span className="font-medium text-foreground">Evidence: </span>
                      {m.fact}
                    </span>
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <Card className="mt-10">
        <CardHeader>
          <CardTitle>Masks and purifiers: different jobs</CardTitle>
          <CardDescription>Neither is a magic shield</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="font-semibold">Well-fitted respirators (N95 / FFP2 / KN95-type)</p>
            <p className="text-muted-foreground">
              Protect <em>you</em> outdoors when the seal is good. Useful when official local guidance recommends them; not suitable for
              everyone, so ask a doctor if you have breathing or heart conditions.
            </p>
          </div>
          <div>
            <p className="font-semibold">HEPA air purifiers</p>
            <p className="text-muted-foreground">
              Clean the air in a <em>room</em> by filtering fine particles. They don’t remove gases and work best with windows closed and
              the right size for the room.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
