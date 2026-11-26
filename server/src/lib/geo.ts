const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** Approximate local solar hour (0-23) for a longitude. Used for labels like "2–4 PM (approx. local time)". */
export function approxLocalHour(date: Date, lon: number): number {
  const h = (date.getUTCHours() + lon / 15) % 24;
  return Math.floor((h + 24) % 24);
}

export function formatHourRange(startHour: number, endHour: number): string {
  const fmt = (h: number) => {
    const hh = ((h % 24) + 24) % 24;
    const suffix = hh >= 12 ? 'PM' : 'AM';
    const twelve = hh % 12 === 0 ? 12 : hh % 12;
    return `${twelve} ${suffix}`;
  };
  return `${fmt(startHour)}–${fmt(endHour)}`;
}
