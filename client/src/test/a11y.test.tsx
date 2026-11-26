import { render, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/context/AuthContext';
import { LocationProvider } from '@/context/LocationContext';
import { AppShell } from '@/components/layout/AppShell';
import Auth from '@/pages/Auth';
import Chat from '@/pages/Chat';
import Community from '@/pages/Community';
import Dashboard from '@/pages/Dashboard';
import Impact from '@/pages/Impact';
import Indoor from '@/pages/Indoor';
import Landing from '@/pages/Landing';
import Learn from '@/pages/Learn';
import Mobility from '@/pages/Mobility';
import Planner from '@/pages/Planner';
import Settings from '@/pages/Settings';
import { useStaticBackend } from './staticFetch';

expect.extend(toHaveNoViolations);

const pages: Array<[string, () => React.ReactElement]> = [
  ['Landing', () => <Landing />],
  ['Auth', () => <Auth />],
  ['Dashboard', () => <Dashboard />],
  ['Planner', () => <Planner />],
  ['Indoor', () => <Indoor />],
  ['Mobility', () => <Mobility />],
  ['Chat', () => <Chat />],
  ['Impact', () => <Impact />],
  ['Community', () => <Community />],
  ['Learn', () => <Learn />],
  ['Settings', () => <Settings />],
  ['AppShell', () => <AppShell />],
];

beforeEach(() => {
  localStorage.clear();
  sessionStorage.setItem('bw.demoId', JSON.stringify('demo-a11ytestsession01'));
  useStaticBackend();
});
afterEach(() => vi.unstubAllGlobals());

describe('accessibility (axe) against the real in-browser backend', () => {
  it.each(pages)('%s has no detectable WCAG violations', async (_name, ui) => {
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <LocationProvider>{ui()}</LocationProvider>
        </AuthProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(container.querySelector('[aria-busy="true"]')).toBeNull(), { timeout: 4000 }).catch(() => undefined);
    expect(await axe(container)).toHaveNoViolations();
  });
});
