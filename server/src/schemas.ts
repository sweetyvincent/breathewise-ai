import { z } from 'zod';
import { sanitizeText } from './lib/sanitize';
import { MODES, type ModeId } from './lib/emissions';

/** Short free text that is sanitised (markup stripped, length-capped) as it is parsed. */
const text = (max: number) =>
  z
    .string()
    .max(max * 4) // reject absurd payloads before sanitising
    .transform((s) => sanitizeText(s, max));

export const AGE_GROUPS = ['child', 'teen', 'adult', 'senior'] as const;
export const OCCUPATIONS = ['student', 'office', 'remote', 'field_outdoor', 'driver_delivery', 'homemaker', 'retired', 'other'] as const;
export const COMMUTES = ['walk', 'cycle', 'two_wheeler', 'car', 'bus', 'metro', 'carpool', 'work_from_home'] as const;
export const OUTDOOR_FREQ = ['rarely', 'weekly', 'several_per_week', 'daily'] as const;
export const LIFESTYLE = ['outdoor_exercise', 'indoor_exercise', 'cooks_daily', 'has_pets', 'eco_focused', 'budget_conscious'] as const;
export const SENSITIVITIES = ['asthma', 'respiratory', 'heart', 'pregnancy', 'allergies'] as const;

export const modeIdSchema = z.enum(Object.keys(MODES) as [ModeId, ...ModeId[]]);

export const locationSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  name: text(80).optional(),
});
export type LocationInput = z.infer<typeof locationSchema>;

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM (24h)');

export const userProfileSchema = z.object({
  ageGroup: z.enum(AGE_GROUPS),
  occupation: z.enum(OCCUPATIONS),
  commute: z.enum(COMMUTES),
  outdoorFrequency: z.enum(OUTDOOR_FREQ),
  lifestyle: z.array(z.enum(LIFESTYLE)).max(LIFESTYLE.length).default([]),
  /** Voluntary. Never required, never used for anything except tailoring caution. */
  sensitivities: z.array(z.enum(SENSITIVITIES)).max(SENSITIVITIES.length).default([]),
  workHours: z.object({ start: hhmm, end: hhmm }).default({ start: '09:00', end: '17:00' }),
});
export type PlanProfile = z.infer<typeof userProfileSchema>;

export const dailyPlanRequestSchema = z.object({
  location: locationSchema,
  profile: userProfileSchema,
  demo: z.boolean().optional(),
});

export const BUDGETS = ['free', 'low', 'medium', 'high'] as const;
export const VENTILATION = ['good', 'limited', 'none'] as const;

export const homeSchema = z.object({
  sizeSqm: z.coerce.number().min(10).max(1000),
  rooms: z.coerce.number().int().min(1).max(20),
  budget: z.enum(BUDGETS),
  hasChildren: z.boolean().default(false),
  hasElderly: z.boolean().default(false),
  hasPets: z.boolean().default(false),
  ventilation: z.enum(VENTILATION),
  hasAirConditioner: z.boolean().default(false),
  cooksIndoors: z.boolean().default(true),
  usesIncenseOrCandles: z.boolean().default(false),
  smokersInHome: z.boolean().default(false),
});
export type HomeProfile = z.infer<typeof homeSchema>;

export const indoorRequestSchema = z.object({
  location: locationSchema,
  home: homeSchema,
  demo: z.boolean().optional(),
});

export const mobilityRequestSchema = z.object({
  location: locationSchema,
  origin: text(80).optional(),
  destination: text(80).optional(),
  distanceKm: z.coerce.number().min(0.1).max(500),
  preferredMode: modeIdSchema,
  tripsPerWeek: z.coerce.number().int().min(1).max(30).default(5),
  travellingWithChildrenOrElderly: z.boolean().default(false),
  sensitive: z.boolean().default(false),
  demo: z.boolean().optional(),
});
export type MobilityRequest = z.infer<typeof mobilityRequestSchema>;

export const chatRequestSchema = z
  .object({
    messages: z
      .array(z.object({ role: z.enum(['user', 'assistant']), content: text(1500) }))
      .min(1)
      .max(20),
    location: locationSchema.optional(),
    profile: userProfileSchema.partial().optional(),
    demo: z.boolean().optional(),
  })
  .refine((b) => b.messages[b.messages.length - 1]?.role === 'user' && (b.messages[b.messages.length - 1]?.content.length ?? 0) > 0, {
    message: 'The last message must be a non-empty message from the user.',
    path: ['messages'],
  });

export const ACTIVITY_TYPES = [
  'walk',
  'cycle',
  'metro',
  'bus',
  'carpool',
  'e_scooter',
  'ev_car',
  'avoided_trip',
  'household_habit',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const impactRequestSchema = z.object({
  activities: z
    .array(
      z.object({
        type: z.enum(ACTIVITY_TYPES),
        /** Distance of the trip (or the trip avoided). Optional for household habits. */
        distanceKm: z.coerce.number().min(0).max(500).default(0),
        count: z.coerce.number().int().min(1).max(50).default(1),
        /** Log a past activity (0 = today). */
        daysAgo: z.coerce.number().int().min(0).max(180).default(0),
        note: text(120).optional(),
      }),
    )
    .min(1)
    .max(20),
  save: z.boolean().default(true),
});

export const REPORT_TYPES = ['garbage_burning', 'construction_dust', 'vehicle_emissions', 'industrial_smoke', 'other'] as const;
export const reportRequestSchema = z.object({
  type: z.enum(REPORT_TYPES),
  description: text(500).refine((s) => s.length >= 10, 'Please describe what you saw (at least 10 characters).'),
  /** Neighbourhood-level label typed by the user, e.g. "Sector 21". Do not enter a house address. */
  areaLabel: text(80).refine((s) => s.length >= 2, 'Area is required.'),
  /** Optional coordinates; coarsened (~1 km) before storage. */
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
});

export const reportsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const storedProfileSchema = z.object({
  name: text(80).default(''),
  location: locationSchema.optional(),
  ageGroup: z.enum(AGE_GROUPS).optional(),
  occupation: z.enum(OCCUPATIONS).optional(),
  preferences: z
    .object({
      commute: z.enum(COMMUTES).optional(),
      outdoorFrequency: z.enum(OUTDOOR_FREQ).optional(),
      lifestyle: z.array(z.enum(LIFESTYLE)).optional(),
      sensitivities: z.array(z.enum(SENSITIVITIES)).optional(),
      workHours: z.object({ start: hhmm, end: hhmm }).optional(),
      notifications: z.object({ highAqiAlerts: z.boolean().default(true), dailyPlanReminder: z.boolean().default(false) }).optional(),
      privacy: z.object({ saveChatHistory: z.boolean().default(true), saveAqiHistory: z.boolean().default(true) }).optional(),
    })
    .default({}),
});
export type StoredProfileInput = z.infer<typeof storedProfileSchema>;
