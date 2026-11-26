/** Static copy of the AQI bands (India CPCB NAQI) for legends and chart colouring. The server remains the source of truth for the current reading. */
export interface Band {
  key: string;
  label: string;
  min: number;
  max: number;
  color: string;
  bg: string;
  fg: string;
}

export const AQI_BANDS: Band[] = [
  { key: 'good', label: 'Good', min: 0, max: 50, color: '#16A34A', bg: '#DCFCE7', fg: '#14532D' },
  { key: 'satisfactory', label: 'Satisfactory', min: 51, max: 100, color: '#65A30D', bg: '#ECFCCB', fg: '#365314' },
  { key: 'moderate', label: 'Moderate', min: 101, max: 200, color: '#CA8A04', bg: '#FEF9C3', fg: '#713F12' },
  { key: 'poor', label: 'Poor', min: 201, max: 300, color: '#EA580C', bg: '#FFEDD5', fg: '#7C2D12' },
  { key: 'very_poor', label: 'Very Poor', min: 301, max: 400, color: '#DC2626', bg: '#FEE2E2', fg: '#7F1D1D' },
  { key: 'severe', label: 'Severe', min: 401, max: 500, color: '#9F1239', bg: '#FFE4E6', fg: '#881337' },
];

export const bandFor = (aqi: number): Band => AQI_BANDS.find((b) => aqi <= b.max) ?? (AQI_BANDS[AQI_BANDS.length - 1] as Band);

export const POLLUTANTS = [
  { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', blurb: 'Fine particles that reach deep into the lungs' },
  { key: 'pm10', label: 'PM10', unit: 'µg/m³', blurb: 'Dust and coarse particles' },
  { key: 'no2', label: 'NO₂', unit: 'µg/m³', blurb: 'Mostly from traffic and combustion' },
  { key: 'so2', label: 'SO₂', unit: 'µg/m³', blurb: 'From burning coal and industry' },
  { key: 'co', label: 'CO', unit: 'mg/m³', blurb: 'From incomplete combustion' },
  { key: 'o3', label: 'O₃', unit: 'µg/m³', blurb: 'Forms in sunlight; worst on hot afternoons' },
] as const;
