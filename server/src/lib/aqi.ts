/**
 * AQI engine.
 *
 * Scale: India's National AQI (CPCB NAQI), 0–500, six categories. Air-quality providers report raw
 * concentrations (µg/m³); we convert them with the CPCB breakpoint tables ourselves so that a single,
 * explicit scale is used everywhere (the provider's own 1–5 index is never mixed in).
 *
 * Caveat (surfaced in the UI): the official NAQI uses 24-hour averages (8-hour for O3/CO). We apply the
 * same breakpoints to the latest hourly concentration, so the number is an *indicative* real-time AQI.
 */

export type PollutantKey = 'pm25' | 'pm10' | 'no2' | 'so2' | 'co' | 'o3';

/** PM/NO2/SO2/O3 in µg/m³, CO in mg/m³. */
export type Pollutants = Record<PollutantKey, number>;

export const POLLUTANT_META: Record<PollutantKey, { label: string; unit: string }> = {
  pm25: { label: 'PM2.5', unit: 'µg/m³' },
  pm10: { label: 'PM10', unit: 'µg/m³' },
  no2: { label: 'NO₂', unit: 'µg/m³' },
  so2: { label: 'SO₂', unit: 'µg/m³' },
  co: { label: 'CO', unit: 'mg/m³' },
  o3: { label: 'O₃', unit: 'µg/m³' },
};

/** [concLow, concHigh, indexLow, indexHigh]; segments are contiguous so interpolation is continuous. */
type Segment = [number, number, number, number];

const BREAKPOINTS: Record<PollutantKey, Segment[]> = {
  pm25: [
    [0, 30, 0, 50],
    [30, 60, 50, 100],
    [60, 90, 100, 200],
    [90, 120, 200, 300],
    [120, 250, 300, 400],
    [250, 380, 400, 500],
  ],
  pm10: [
    [0, 50, 0, 50],
    [50, 100, 50, 100],
    [100, 250, 100, 200],
    [250, 350, 200, 300],
    [350, 430, 300, 400],
    [430, 510, 400, 500],
  ],
  no2: [
    [0, 40, 0, 50],
    [40, 80, 50, 100],
    [80, 180, 100, 200],
    [180, 280, 200, 300],
    [280, 400, 300, 400],
    [400, 520, 400, 500],
  ],
  so2: [
    [0, 40, 0, 50],
    [40, 80, 50, 100],
    [80, 380, 100, 200],
    [380, 800, 200, 300],
    [800, 1600, 300, 400],
    [1600, 2100, 400, 500],
  ],
  co: [
    [0, 1, 0, 50],
    [1, 2, 50, 100],
    [2, 10, 100, 200],
    [10, 17, 200, 300],
    [17, 34, 300, 400],
    [34, 50, 400, 500],
  ],
  o3: [
    [0, 50, 0, 50],
    [50, 100, 50, 100],
    [100, 168, 100, 200],
    [168, 208, 200, 300],
    [208, 748, 300, 400],
    [748, 1000, 400, 500],
  ],
};

export function subIndex(pollutant: PollutantKey, concentration: number): number {
  if (!Number.isFinite(concentration) || concentration < 0) return 0;
  const segments = BREAKPOINTS[pollutant];
  for (const [cLo, cHi, iLo, iHi] of segments) {
    if (concentration <= cHi) return iLo + ((concentration - cLo) / (cHi - cLo)) * (iHi - iLo);
  }
  return 500; // beyond the table: cap at the top of the scale
}

export interface AqiComputation {
  aqi: number;
  dominant: PollutantKey;
  subIndices: Record<PollutantKey, number>;
}

export function computeAqi(p: Pollutants): AqiComputation {
  const keys = Object.keys(BREAKPOINTS) as PollutantKey[];
  const subIndices = Object.fromEntries(keys.map((k) => [k, Math.round(subIndex(k, p[k]))])) as Record<PollutantKey, number>;
  let dominant: PollutantKey = 'pm25';
  for (const k of keys) if (subIndices[k] > subIndices[dominant]) dominant = k;
  return { aqi: subIndices[dominant], dominant, subIndices };
}

export type AqiKey = 'good' | 'satisfactory' | 'moderate' | 'poor' | 'very_poor' | 'severe';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'very_high';

export interface AqiCategory {
  key: AqiKey;
  label: string;
  range: [number, number];
  /** 0 (good) … 5 (severe). Used for rule-based decisions. */
  level: 0 | 1 | 2 | 3 | 4 | 5;
  risk: RiskLevel;
  /** Strong colour for strokes/gauges; `bg`/`fg` are an accessible tint/text pair (contrast ≥ 7:1). */
  color: string;
  bg: string;
  fg: string;
  healthMessage: string;
  sensitiveMessage: string;
}

export const AQI_CATEGORIES: AqiCategory[] = [
  {
    key: 'good',
    label: 'Good',
    range: [0, 50],
    level: 0,
    risk: 'low',
    color: '#16A34A',
    bg: '#DCFCE7',
    fg: '#14532D',
    healthMessage: 'Air quality is currently Good. It is a fine time for outdoor activity for most people.',
    sensitiveMessage: 'Sensitive individuals can usually go about normal routines; stay aware if symptoms appear.',
  },
  {
    key: 'satisfactory',
    label: 'Satisfactory',
    range: [51, 100],
    level: 1,
    risk: 'low',
    color: '#65A30D',
    bg: '#ECFCCB',
    fg: '#365314',
    healthMessage: 'Air quality is currently Satisfactory. Most people can be active outdoors.',
    sensitiveMessage: 'People with breathing sensitivities may notice minor discomfort during long or intense exertion.',
  },
  {
    key: 'moderate',
    label: 'Moderate',
    range: [101, 200],
    level: 2,
    risk: 'moderate',
    color: '#CA8A04',
    bg: '#FEF9C3',
    fg: '#713F12',
    healthMessage: 'Air quality is currently Moderate. Some people may feel discomfort during prolonged outdoor exertion.',
    sensitiveMessage:
      'Children, older adults and people with lung or heart conditions should take it easier outdoors and keep any prescribed medication handy.',
  },
  {
    key: 'poor',
    label: 'Poor',
    range: [201, 300],
    level: 3,
    risk: 'high',
    color: '#EA580C',
    bg: '#FFEDD5',
    fg: '#7C2D12',
    healthMessage:
      'Air quality is currently Poor. Sensitive individuals should reduce prolonged outdoor exertion. Consider indoor activities and check local advisories.',
    sensitiveMessage: 'Children, older adults and people with respiratory or heart conditions should avoid prolonged outdoor exertion.',
  },
  {
    key: 'very_poor',
    label: 'Very Poor',
    range: [301, 400],
    level: 4,
    risk: 'very_high',
    color: '#DC2626',
    bg: '#FEE2E2',
    fg: '#7F1D1D',
    healthMessage:
      'Air quality is currently Very Poor. Everyone should limit time and exertion outdoors; follow official local health advisories.',
    sensitiveMessage:
      'Sensitive groups should stay indoors as much as practical and follow guidance from their doctor and local health authorities.',
  },
  {
    key: 'severe',
    label: 'Severe',
    range: [401, 500],
    level: 5,
    risk: 'very_high',
    color: '#9F1239',
    bg: '#FFE4E6',
    fg: '#881337',
    healthMessage:
      'Air quality is currently Severe. Avoid outdoor exertion, keep indoor air as clean as possible and follow official health advisories.',
    sensitiveMessage: 'Sensitive groups should remain indoors and seek medical advice promptly if they feel unwell.',
  },
];

export function categorize(aqi: number): AqiCategory {
  const clamped = Math.max(0, Math.min(500, Math.round(aqi)));
  const found = AQI_CATEGORIES.find((c) => clamped <= c.range[1]);
  return found ?? (AQI_CATEGORIES[AQI_CATEGORIES.length - 1] as AqiCategory);
}

export const SCALE_INFO = {
  name: 'India National AQI (CPCB NAQI), 0–500',
  note: 'Computed from provider pollutant concentrations using CPCB breakpoints. Official NAQI uses 24-hour averages; this is an indicative real-time value from the latest hourly concentration.',
} as const;
