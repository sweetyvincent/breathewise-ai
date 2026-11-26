import { describe, expect, it } from 'vitest';
import { MODES, savedVsBaselineKg, tripEmissionsKg, tripMinutes } from '../src/lib/emissions';
import { calculateActivity, calculateImpact, scoreFor, summarizeImpact } from '../src/services/impact';
import type { ImpactRecord } from '../src/store/types';

describe('emissions model', () => {
  it('computes kg CO2 from g/km × distance', () => {
    expect(tripEmissionsKg('car_petrol', 10)).toBeCloseTo(1.7, 3);
    expect(tripEmissionsKg('walk', 10)).toBe(0);
  });

  it('never reports negative savings', () => {
    expect(savedVsBaselineKg('car_petrol', 10)).toBe(0);
    expect(savedVsBaselineKg('metro', 10)).toBeGreaterThan(0);
  });

  it('ranks modes sensibly (walk < metro < bus < petrol car)', () => {
    const g = (m: keyof typeof MODES) => MODES[m].gPerKm;
    expect(g('walk')).toBeLessThan(g('metro'));
    expect(g('metro')).toBeLessThan(g('bus'));
    expect(g('bus')).toBeLessThan(g('car_petrol'));
    expect(g('carpool')).toBeLessThan(g('car_petrol'));
  });

  it('estimates travel time from speed', () => {
    expect(tripMinutes('walk', 5)).toBe(60);
    expect(tripMinutes('metro', 15)).toBe(30);
  });
});

describe('impact calculation', () => {
  it('credits an avoided trip with full baseline emissions', () => {
    const a = calculateActivity({ type: 'avoided_trip', distanceKm: 10, count: 2 });
    expect(a.co2SavedKg).toBeCloseTo(3.4, 2);
    expect(a.fuelSavedL).toBeCloseTo(1.4, 2); // 20 km × 0.07 L/km
  });

  it('household habits count but carry no CO2 value', () => {
    const r = calculateImpact([
      { type: 'household_habit', distanceKm: 0, count: 3 },
      { type: 'bus', distanceKm: 10, count: 1 },
    ]);
    expect(r.totals.habits).toBe(3);
    expect(r.totals.sustainableTrips).toBe(1);
    expect(r.items[0]?.co2SavedKg).toBe(0);
  });

  it('scales with trip count', () => {
    const one = calculateActivity({ type: 'metro', distanceKm: 8, count: 1 });
    const five = calculateActivity({ type: 'metro', distanceKm: 8, count: 5 });
    expect(five.co2SavedKg).toBeCloseTo(one.co2SavedKg * 5, 2);
  });

  it('caps the score at 100', () => {
    expect(scoreFor(50, 100, 50)).toBe(100);
    expect(scoreFor(0, 0, 0)).toBe(0);
  });
});

describe('impact summary', () => {
  const now = Date.parse('2026-11-18T12:00:00Z');
  const rec = (daysAgo: number, type: ImpactRecord['transportType'], km: number, trips: number, co2: number): ImpactRecord => ({
    id: String(Math.random()),
    userId: 'u',
    transportType: type,
    distance: km,
    tripCount: trips,
    estimatedCo2Saved: co2,
    createdAt: new Date(now - daysAgo * 86_400_000).toISOString(),
  });

  it('aggregates 7-day, 30-day and per-week buckets', () => {
    const s = summarizeImpact(
      [rec(1, 'metro', 10, 2, 1), rec(3, 'bus', 5, 1, 0.5), rec(20, 'carpool', 10, 1, 1.1), rec(100, 'metro', 10, 1, 0.9)],
      now,
    );
    expect(s.last7Days.trips).toBe(3);
    expect(s.last7Days.co2SavedKg).toBeCloseTo(1.5, 2);
    expect(s.last30Days.trips).toBe(4);
    expect(s.allTime.trips).toBe(5);
    expect(s.weekly).toHaveLength(8);
    expect(s.monthly).toHaveLength(6);
  });

  it('includes the estimate disclaimer and does not claim an AQI effect', () => {
    const s = summarizeImpact([], now);
    expect(s.disclaimer).toMatch(/do not reduce your local AQI/i);
    expect(s.score.value).toBe(0);
  });
});
