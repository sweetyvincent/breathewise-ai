import type { ActivityInput } from '@/lib/types';

/** A realistic 8-week history so judges can see the charts and score without logging data by hand. */
export const SAMPLE_WEEK: ActivityInput[] = [
  { type: 'metro', distanceKm: 12, count: 2, daysAgo: 0 },
  { type: 'bus', distanceKm: 8, count: 2, daysAgo: 1 },
  { type: 'carpool', distanceKm: 15, count: 2, daysAgo: 2 },
  { type: 'walk', distanceKm: 2, count: 3, daysAgo: 3 },
  { type: 'avoided_trip', distanceKm: 6, count: 1, daysAgo: 4 },
  { type: 'household_habit', distanceKm: 0, count: 3, daysAgo: 5 },
  { type: 'metro', distanceKm: 12, count: 4, daysAgo: 8 },
  { type: 'cycle', distanceKm: 4, count: 3, daysAgo: 10 },
  { type: 'bus', distanceKm: 8, count: 5, daysAgo: 16 },
  { type: 'carpool', distanceKm: 15, count: 4, daysAgo: 24 },
  { type: 'metro', distanceKm: 12, count: 6, daysAgo: 38 },
  { type: 'avoided_trip', distanceKm: 6, count: 3, daysAgo: 52 },
];

/** Choices for the "When" select: the server accepts up to 180 days back, the form offers the last week. */
const RECENT_DAYS_BACK = [2, 3, 4, 5, 6];
export const WHEN_OPTIONS = [
  { value: '0', label: 'Today' },
  { value: '1', label: 'Yesterday' },
  ...RECENT_DAYS_BACK.map((d) => ({ value: String(d), label: `${d} days ago` })),
];

/** The only activity type that has no distance. */
export const HABIT_TYPE = 'household_habit';
