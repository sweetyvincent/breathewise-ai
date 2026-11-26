import { describe, expect, it } from 'vitest';
import { createAirQualityService } from '../src/services/airQuality';
import { DEMO_CITIES, diurnalFactor, nearestProfile } from '../src/services/simulated';
import { DELHI, FIXED_NOW } from './helpers';

describe('simulated air quality (demo mode)', () => {
  const svc = () => createAirQualityService({ now: () => FIXED_NOW });

  it('is always labelled as simulated, never live', async () => {
    const r = await svc().get(DELHI);
    expect(r.source).toBe('simulated');
    expect(r.provider).toMatch(/simulator/i);
    expect(r.notes.join(' ')).toMatch(/SIMULATED/);
  });

  it('is deterministic for the same hour (stable across refreshes)', async () => {
    const a = await createAirQualityService({ now: () => FIXED_NOW }).get(DELHI);
    const b = await createAirQualityService({ now: () => FIXED_NOW + 5 * 60_000 }).get(DELHI);
    expect(b.aqi).toBe(a.aqi);
  });

  it('returns 48 hourly points (24 past + 24 ahead) and 7-8 day buckets', async () => {
    const r = await svc().get(DELHI);
    expect(r.hourly).toHaveLength(48);
    expect(r.hourly.every((h) => h.kind === 'simulated')).toBe(true);
    expect(r.daily.length).toBeGreaterThanOrEqual(7);
    expect(r.daily.length).toBeLessThanOrEqual(8);
  });

  it('reports a category consistent with its AQI on the CPCB scale', async () => {
    const r = await svc().get(DELHI);
    expect(r.scale.name).toMatch(/CPCB/);
    expect(r.aqi).toBeGreaterThanOrEqual(r.category.range[0] - 1);
    expect(r.aqi).toBeLessThanOrEqual(r.category.range[1]);
  });

  it('shows Delhi in winter as more polluted than Bengaluru', async () => {
    const delhi = await svc().get(DELHI);
    const blr = await svc().get({ lat: 12.9716, lon: 77.5946, name: 'Bengaluru' });
    expect(delhi.pollutants.pm25).toBeGreaterThan(blr.pollutants.pm25);
  });

  it('caches within the TTL and recomputes the age of data', async () => {
    let t = FIXED_NOW;
    const s = createAirQualityService({ now: () => t });
    const first = await s.get(DELHI);
    t += 4 * 60_000;
    const second = await s.get(DELHI);
    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(second.ageMinutes).toBeGreaterThanOrEqual(first.ageMinutes);
  });

  it('maps arbitrary coordinates to the nearest demo profile', () => {
    expect(nearestProfile(28.7, 77.1).name).toBe('Delhi, India');
    expect(DEMO_CITIES.length).toBeGreaterThanOrEqual(6);
  });

  it('has a diurnal pattern with a mid-afternoon low and a night peak', () => {
    expect(diurnalFactor(15)).toBeLessThan(diurnalFactor(22));
  });
});
