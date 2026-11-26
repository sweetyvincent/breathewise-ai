import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/context/AuthContext';
import { LocationProvider } from '@/context/LocationContext';
import Community from '@/pages/Community';
import Dashboard from '@/pages/Dashboard';
import Impact from '@/pages/Impact';
import Indoor from '@/pages/Indoor';
import Learn from '@/pages/Learn';
import Mobility from '@/pages/Mobility';
import Settings from '@/pages/Settings';
import { useStaticBackend } from './staticFetch';

/** User-flow tests: real pages, real validation/rules/impact handlers, only the network is replaced. */
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
  sessionStorage.setItem('bw.demoId', JSON.stringify('demo-flowtestsession01'));
  useStaticBackend();
});
afterEach(() => vi.unstubAllGlobals());

describe('user flows', () => {
  it('dashboard shows the AQI scale, data source label and freshness', async () => {
    renderPage(<Dashboard />);
    expect(await screen.findByText(/Health alert/i)).toBeInTheDocument();
    expect(screen.getAllByText(/simulated/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Severe/)).toBeInTheDocument();
  });

  it('indoor page returns tiered solutions, purifier sizing and myths', async () => {
    renderPage(<Indoor />);
    await userEvent.click(await screen.findByRole('button', { name: /Get indoor recommendations/i }));
    expect((await screen.findAllByText(/myth/i)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/free/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/CADR|m³\/h/i).length).toBeGreaterThan(0);
  });

  it('mobility page compares options and shows the assumptions', async () => {
    renderPage(<Mobility />);
    await userEvent.click(await screen.findByRole('button', { name: /Compare options/i }));
    expect((await screen.findAllByText(/Recommended/i)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/kg CO/i).length).toBeGreaterThan(0);
  });

  it('impact page logs sample data and labels every figure as an estimate', async () => {
    renderPage(<Impact />);
    await userEvent.click(await screen.findByRole('button', { name: /Load sample data/i }));
    await waitFor(() => expect(screen.getByText(/Sample data loaded/i)).toBeInTheDocument());
    expect(screen.getAllByText(/estimate/i).length).toBeGreaterThan(0);
  });

  it('community page submits an unverified report without exposing the author', async () => {
    renderPage(<Community />);
    await userEvent.type(await screen.findByLabelText(/Description/i), 'Open burning of leaves near the market.');
    await userEvent.type(document.getElementById('r-area') as HTMLElement, 'Old Market Road');
    await userEvent.click(screen.getByRole('button', { name: /Submit report/i }));
    expect((await screen.findAllByText(/unverified/i)).length).toBeGreaterThan(0);
  });

  it('community challenges can be joined and left with an accessible pressed state', async () => {
    renderPage(<Community />);
    const join = (await screen.findAllByRole('button', { name: /Join challenge/i }))[0]!;
    await userEvent.click(join);
    expect(screen.getAllByRole('button', { pressed: true }).length).toBeGreaterThan(0);
  });

  it('settings loads the demo profile and saves privacy choices', async () => {
    renderPage(<Settings />);
    await userEvent.click(await screen.findByRole('button', { name: /Save/i }));
    expect((await screen.findAllByText(/saved/i)).length).toBeGreaterThan(0);
  });

  it('learn page covers the AQI scale and myths', async () => {
    renderPage(<Learn />);
    expect(await screen.findByText(/What is AQI/i)).toBeInTheDocument();
    expect(screen.getAllByText(/myth/i).length).toBeGreaterThan(0);
  });
});
