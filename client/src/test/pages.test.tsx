import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/context/AuthContext';
import { LocationProvider } from '@/context/LocationContext';
import Chat from '@/pages/Chat';
import Planner from '@/pages/Planner';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const dq = {
  source: 'simulated',
  provider: 'sim',
  scale: 'India CPCB',
  observedAt: new Date().toISOString(),
  ageMinutes: 3,
  location: 'Delhi, India',
  aqi: 258,
  category: 'Poor',
  weatherAvailable: true,
  notes: [],
};

function mockServer(overrides: Record<string, () => Response> = {}) {
  const handlers: Record<string, () => Response> = {
    '/api/health': () =>
      json(200, { status: 'ok', mode: { airQuality: 'simulated', ai: 'rules', auth: 'demo', demoLoginEnabled: true, storage: 'memory' } }),
    '/api/locations/search': () => json(200, { results: [{ name: 'Delhi, India', lat: 28.6139, lon: 77.209 }], simulated: true }),
    '/api/ai/chat': () =>
      json(200, {
        reply: '**Right now:** AQI **258** (Poor).\n- Keep windows closed',
        generatedBy: 'rules',
        dataQuality: dq,
        disclaimer: 'x',
      }),
    '/api/ai/daily-plan': () =>
      json(200, {
        generatedBy: 'rules',
        fallbackReason: 'no_api_key',
        model: null,
        dataQuality: dq,
        plan: {
          air_quality_summary: 'Air quality is currently Poor.',
          risk_level: 'high',
          daily_recommendations: [
            { time: 'Morning', action: 'Choose indoor exercise', reason: 'Reduces exposure', impact: 'Lower dose' },
            { time: 'Afternoon', action: 'Take the metro', reason: 'Fewer emissions', impact: 'Saves CO2' },
            { time: 'Evening', action: 'Skip strenuous outdoor activity', reason: 'Evening peak', impact: 'Avoids second peak' },
            { time: 'Night', action: 'Run a HEPA purifier', reason: 'Cleaner sleep air', impact: 'Lower PM2.5' },
          ],
          indoor_tips: ['Wet mop'],
          sustainable_actions: ['Combine errands'],
          important_note: 'Follow official local health guidance.',
        },
      }),
    ...overrides,
  };
  const fn = vi.fn(async (url: URL | string, _init?: RequestInit) => {
    const path = new URL(String(url), 'http://localhost').pathname;
    const h = handlers[path];
    return h ? h() : json(404, { error: { code: 'NOT_FOUND', message: 'nope' } });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

const renderPage = (ui: React.ReactElement) =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <LocationProvider>{ui}</LocationProvider>
      </AuthProvider>
    </MemoryRouter>,
  );

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => vi.unstubAllGlobals());

describe('BreatheBot page', () => {
  it('answers a suggested question with loading state, structured reply and data label', async () => {
    mockServer();
    renderPage(<Chat />);
    await userEvent.click(await screen.findByRole('button', { name: 'Is it safe to go outside today?' }));
    const log = screen.getByRole('log');
    await waitFor(() => expect(within(log).getByText(/Keep windows closed/)).toBeInTheDocument());
    expect(within(log).getByText('Is it safe to go outside today?')).toBeInTheDocument();
    expect(within(log).getByText(/Simulated demo data/i)).toBeInTheDocument();
  });

  it('shows an accessible error with a retry that recovers', async () => {
    let fail = true;
    mockServer({
      '/api/ai/chat': () =>
        fail
          ? json(503, { error: { code: 'UPSTREAM_UNAVAILABLE', message: 'Provider down.' } })
          : json(200, { reply: 'Back online.', generatedBy: 'rules', dataQuality: null, disclaimer: '' }),
    });
    renderPage(<Chat />);
    await userEvent.type(await screen.findByLabelText('Your question'), 'Is it safe?');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Provider down.');
    fail = false;
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    await waitFor(() => expect(screen.getByText('Back online.')).toBeInTheDocument());
  });

  it('persists the conversation locally and can clear it', async () => {
    mockServer();
    renderPage(<Chat />);
    await userEvent.type(await screen.findByLabelText('Your question'), 'hello');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));
    await screen.findByText(/Keep windows closed/);
    expect(JSON.parse(localStorage.getItem('bw.chat') ?? '[]').length).toBeGreaterThan(1);
    await userEvent.click(screen.getByRole('button', { name: /clear conversation/i }));
    expect(screen.queryByText(/Keep windows closed/)).toBeNull();
  });
});

describe('Daily planner page', () => {
  it('has labelled fields, an optional voluntary sensitivity section and generates a plan with reasons', async () => {
    const fetchMock = mockServer();
    renderPage(<Planner />);
    expect(screen.getByLabelText('Age group')).toBeInTheDocument();
    expect(screen.getByLabelText('Daily commute')).toBeInTheDocument();
    expect(screen.getByText(/Voluntary/i)).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Daily commute'), 'car');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Asthma' }));
    await userEvent.click(screen.getByRole('button', { name: /generate my daily plan/i }));

    expect(await screen.findByText('Choose indoor exercise')).toBeInTheDocument();
    expect(screen.getAllByText(/Why:/).length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText(/Smart rules engine/i)).toBeInTheDocument();

    const call = fetchMock.mock.calls.find(([u]) => String(u).includes('/api/ai/daily-plan'))!;
    const body = JSON.parse((call[1] as RequestInit).body as string);
    expect(body.profile.commute).toBe('car');
    expect(body.profile.sensitivities).toContain('asthma');
    expect(body.demo).toBe(true);
  });

  it('shows a friendly error when the API rejects the request', async () => {
    mockServer({
      '/api/ai/daily-plan': () =>
        json(503, { error: { code: 'UPSTREAM_UNAVAILABLE', message: 'The air-quality data provider could not be reached.' } }),
    });
    renderPage(<Planner />);
    await userEvent.click(screen.getByRole('button', { name: /generate my daily plan/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be reached/i);
  });
});
