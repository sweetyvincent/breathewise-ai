import { describe, expect, it } from 'vitest';
import { categorize, computeAqi, subIndex } from '../src/lib/aqi';

describe('CPCB NAQI sub-index', () => {
  it.each([
    ['pm25', 0, 0],
    ['pm25', 30, 50],
    ['pm25', 60, 100],
    ['pm25', 90, 200],
    ['pm25', 120, 300],
    ['pm25', 250, 400],
    ['pm10', 100, 100],
    ['pm10', 250, 200],
    ['no2', 80, 100],
    ['co', 2, 100],
  ] as const)('%s at %s → %s', (pollutant, conc, expected) => {
    expect(Math.round(subIndex(pollutant, conc))).toBe(expected);
  });

  it('interpolates linearly inside a band', () => {
    expect(Math.round(subIndex('pm25', 45))).toBe(75);
  });

  it('caps absurdly high concentrations at 500 and ignores invalid input', () => {
    expect(subIndex('pm25', 5000)).toBe(500);
    expect(subIndex('pm25', -3)).toBe(0);
    expect(subIndex('pm25', Number.NaN)).toBe(0);
  });
});

describe('computeAqi', () => {
  it('uses the worst sub-index and names the dominant pollutant', () => {
    const r = computeAqi({ pm25: 150, pm10: 120, no2: 30, so2: 10, co: 0.8, o3: 40 });
    expect(r.dominant).toBe('pm25');
    expect(r.aqi).toBe(r.subIndices.pm25);
    expect(r.aqi).toBeGreaterThan(300);
  });

  it('can be dominated by a non-particulate pollutant', () => {
    const r = computeAqi({ pm25: 10, pm10: 20, no2: 30, so2: 10, co: 12, o3: 40 });
    expect(r.dominant).toBe('co');
  });
});

describe('categorize (spec scale)', () => {
  it.each([
    [0, 'Good'],
    [50, 'Good'],
    [51, 'Satisfactory'],
    [100, 'Satisfactory'],
    [101, 'Moderate'],
    [200, 'Moderate'],
    [201, 'Poor'],
    [300, 'Poor'],
    [301, 'Very Poor'],
    [400, 'Very Poor'],
    [401, 'Severe'],
    [500, 'Severe'],
    [999, 'Severe'],
  ])('AQI %s is %s', (aqi, label) => {
    expect(categorize(aqi).label).toBe(label);
  });

  it('maps risk levels used by the recommendation engine', () => {
    expect(categorize(30).risk).toBe('low');
    expect(categorize(150).risk).toBe('moderate');
    expect(categorize(250).risk).toBe('high');
    expect(categorize(450).risk).toBe('very_high');
  });

  it('never makes an absolute safety claim in health messages', () => {
    for (const aqi of [10, 80, 150, 250, 350, 450]) {
      expect(categorize(aqi).healthMessage).not.toMatch(/completely safe|100% safe/i);
    }
  });
});
