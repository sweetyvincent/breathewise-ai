import { describe, expect, it } from 'vitest';
import { handleStatic, type StaticRequest } from '@/static/staticBackend';

const DELHI = { lat: '28.6139', lon: '77.209', name: 'Delhi' };
const token = `demo-${'a'.repeat(12)}`;
const call = (r: Partial<StaticRequest> & Pick<StaticRequest, 'method' | 'path'>) => handleStatic({ query: {}, token: null, ...r });
const rejects = async (p: Promise<unknown>) =>
  p.then(
    () => null,
    (e: { status: number; code: string }) => e,
  );

describe('static (GitHub Pages) backend', () => {
  it('reports demo mode and never claims live data', async () => {
    const h = (await call({ method: 'GET', path: '/api/health' })) as { mode: { airQuality: string; ai: string } };
    expect(h.mode).toMatchObject({ airQuality: 'simulated', ai: 'rules' });
  });

  it('serves labelled simulated air quality on the India NAQI scale', async () => {
    const a = (await call({ method: 'GET', path: '/api/air-quality', query: DELHI })) as {
      source: string;
      aqi: number;
      scale: { name: string };
      notes: string[];
    };
    expect(a.source).toBe('simulated');
    expect(a.aqi).toBeGreaterThanOrEqual(0);
    expect(a.aqi).toBeLessThanOrEqual(500);
    expect(a.scale.name).toMatch(/NAQI/);
    expect(a.notes.join(' ')).toMatch(/SIMULATED/);
  });

  it('forces simulated data even if a caller omits the demo flag', async () => {
    const plan = (await call({
      method: 'POST',
      path: '/api/ai/daily-plan',
      body: {
        location: { lat: 28.6, lon: 77.2 },
        profile: { ageGroup: 'adult', occupation: 'office', commute: 'metro', outdoorFrequency: 'weekly' },
      },
    })) as { generatedBy: string; dataQuality: { source: string } };
    expect(plan.generatedBy).toBe('rules');
    expect(plan.dataQuality.source).toBe('simulated');
  });

  it('validates input with the same 400 errors as the server', async () => {
    const e = await rejects(call({ method: 'GET', path: '/api/air-quality', query: { lat: '999', lon: '77' } }));
    expect(e).toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
  });

  it('requires a valid demo token for personal data', async () => {
    expect(await rejects(call({ method: 'GET', path: '/api/impact/history' }))).toMatchObject({ status: 401 });
    expect(await rejects(call({ method: 'GET', path: '/api/impact/history', token: 'demo-short' }))).toMatchObject({ status: 401 });
  });

  it('records impact per demo user and keeps users isolated', async () => {
    await call({
      method: 'POST',
      path: '/api/impact/calculate',
      token,
      body: { activities: [{ type: 'metro', distanceKm: 10, count: 2 }] },
    });
    const mine = (await call({ method: 'GET', path: '/api/impact/history', token })) as { allTime: { co2SavedKg: number } };
    const other = (await call({ method: 'GET', path: '/api/impact/history', token: `demo-${'b'.repeat(12)}` })) as {
      allTime: { co2SavedKg: number };
    };
    expect(mine.allTime.co2SavedKg).toBeGreaterThan(0);
    expect(other.allTime.co2SavedKg).toBe(0);
  });

  it('coarsens report coordinates and hides the author', async () => {
    const out = (await call({
      method: 'POST',
      path: '/api/community/report',
      token,
      body: {
        type: 'construction_dust',
        description: 'Dust cloud from an uncovered site.',
        areaLabel: 'Sector 21',
        lat: 28.613944,
        lon: 77.209021,
      },
    })) as { report: Record<string, unknown> };
    expect(out.report.approxLat).toBe(28.61);
    expect(out.report.approxLon).toBe(77.21);
    expect(out.report).not.toHaveProperty('userId');
    expect(out.report.statusLabel).toMatch(/Unverified/);
  });

  it('sanitises markup in submitted text', async () => {
    const out = (await call({
      method: 'POST',
      path: '/api/community/report',
      token,
      body: { type: 'other', description: '<script>alert(1)</script>Smoke near the market', areaLabel: 'Market' },
    })) as { report: { description: string } };
    expect(out.report.description).not.toMatch(/<script/i);
  });

  it('refuses to invent data when BreatheBot has no location', async () => {
    const r = (await call({
      method: 'POST',
      path: '/api/ai/chat',
      body: { messages: [{ role: 'user', content: 'Is it safe to go outside?' }] },
    })) as { reply: string; dataQuality: unknown };
    expect(r.reply).toMatch(/don't have air-quality data/i);
    expect(r.dataQuality).toBeNull();
  });

  it('returns 404 for unknown routes', async () => {
    expect(await rejects(call({ method: 'GET', path: '/api/nope' }))).toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });
});
