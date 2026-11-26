# BreatheWise AI – REST API

Base URL: `http://localhost:8787` in development (the Vite dev server proxies `/api` to it). All bodies are JSON.

## Conventions

**Authentication.** Send `Authorization: Bearer <token>`.

| Token | When |
|---|---|
| Supabase access token (JWT) | Production. Verified server-side with `supabase.auth.getUser`. |
| `demo-<8–64 chars of [A-Za-z0-9_-]>` | Demo login (`DEMO_MODE=true`, or development without Supabase). Each id is an isolated, in-memory user. Disabled in production unless `DEMO_MODE=true`. |

Auth levels: **public** (no token), **optional** (token enables saving to your account), **required** (401 without a valid token).

**Errors** always use one shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Some inputs are invalid.",
             "details": [{ "field": "distanceKm", "message": "Number must be less than or equal to 500" }],
             "requestId": "5f0c…" } }
```

| HTTP | `code` | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body/query failed schema validation (or malformed JSON) |
| 401 | `UNAUTHORIZED` | Missing/invalid token on a protected route |
| 404 | `NOT_FOUND` | Unknown route |
| 413 | `VALIDATION_ERROR` | Body over 50 KB |
| 429 | `RATE_LIMITED` | Too many requests (see limits below) |
| 503 | `UPSTREAM_UNAVAILABLE` | Air-data provider or database unreachable / returned an invalid response. **No data is fabricated.** |
| 500 | `INTERNAL_ERROR` | Unexpected; details are logged server-side only |

**Rate limits** (per IP): general 120/min on `/api/*`; AI 15/min on `/api/ai/*`; community report writes 20/hour. Standard `RateLimit-*` headers are returned.

**Data provenance.** Every response that depends on air data carries `source: "live" | "simulated"`. Simulated data is always labelled; the UI never presents it as live.

**AQI scale.** India National AQI (CPCB NAQI), 0–500: Good 0–50 · Satisfactory 51–100 · Moderate 101–200 · Poor 201–300 · Very Poor 301–400 · Severe 401–500. Provider concentrations are converted with CPCB breakpoints; the provider's own 1–5 index is never mixed in.

Common location object (for AI endpoints): `{ "lat": 28.6139, "lon": 77.209, "name": "Delhi, India" }` (`name` optional). Add `"demo": true` to any AI body to force simulated data.

---

## Health & environment

### `GET /api/health` — public
```json
{ "status": "ok",
  "mode": { "airQuality": "simulated", "ai": "rules", "auth": "demo", "demoLoginEnabled": true, "storage": "memory" },
  "time": "2026-11-19T07:44:40.197Z" }
```

### `GET /api/air-quality?lat=&lon=&name=&demo=` — optional auth
`lat` −90..90, `lon` −180..180 (required). `demo=true` forces simulated data. Cached 10 min per ~1 km cell.

```json
{
  "source": "simulated",
  "provider": "BreatheWise demo simulator",
  "scale": { "name": "India National AQI (CPCB NAQI), 0–500", "note": "Computed from provider pollutant concentrations…" },
  "location": { "name": "Delhi, India", "lat": 28.6139, "lon": 77.209 },
  "observedAt": "2026-11-19T07:00:00.000Z", "fetchedAt": "…", "ageMinutes": 44, "cached": false,
  "aqi": 280,
  "category": { "key": "poor", "label": "Poor", "level": 3, "risk": "high", "color": "#EA580C", "bg": "#FFEDD5", "fg": "#7C2D12",
                "healthMessage": "Air quality is currently Poor. Sensitive individuals should reduce…", "sensitiveMessage": "…" },
  "dominantPollutant": "pm25",
  "pollutants": { "pm25": 114.1, "pm10": 183.5, "no2": 44.1, "so2": 11.5, "co": 1.77, "o3": 55.8 },
  "subIndices": { "pm25": 280, "pm10": 168, "no2": 55, "so2": 14, "co": 87, "o3": 55 },
  "hourly": [{ "time": "…", "aqi": 312, "pm25": 120.4, "kind": "observed | forecast | simulated" }],
  "daily":  [{ "date": "2026-11-18", "aqi": 340, "pm25": 142.2 }],
  "notes": ["SIMULATED DEMO DATA, not a real measurement…"]
}
```
Units: PM/NO₂/SO₂/O₃ in µg/m³, CO in mg/m³. When live data is configured and the provider fails, the endpoint returns **503** (never invented numbers); `demo=true` is the explicit opt-in to labelled simulated data.

### `GET /api/weather?lat=&lon=&name=&demo=` — public
```json
{ "source": "live", "provider": "OpenWeather Current Weather API", "observedAt": "…",
  "tempC": 16.4, "humidity": 48, "windSpeedMs": 2.2, "description": "haze", "location": { … } }
```

### `GET /api/locations/search?q=` — public
Geocoding via OpenWeather when configured, otherwise a list of demo cities. Empty `q` returns example locations.
```json
{ "results": [{ "name": "Delhi, India", "lat": 28.6139, "lon": 77.209 }], "simulated": true }
```

---

## AI recommendation endpoints — optional auth

Each response includes `generatedBy` (`"openai"` or `"rules"`), `fallbackReason` (`null | "no_api_key" | "ai_error" | "invalid_output" | "safety_screen"`), `model`, and `dataQuality` (source, provider, scale, observedAt, ageMinutes, aqi, category, notes) describing exactly what the advice was based on.

How output is protected: the model's JSON is **validated against a strict schema**, **screened** (unsafe medical/absolute claims, "plants clean air", invented AQI numbers), and **post-processed** so server-computed facts (risk level, purifier size, all emission numbers) always override the model. On any failure the deterministic rules engine answers instead.

### `POST /api/ai/daily-plan`
```json
{ "location": { "lat": 28.6139, "lon": 77.209, "name": "Delhi" },
  "profile": {
    "ageGroup": "child | teen | adult | senior",
    "occupation": "student | office | remote | field_outdoor | driver_delivery | homemaker | retired | other",
    "commute": "walk | cycle | two_wheeler | car | bus | metro | carpool | work_from_home",
    "outdoorFrequency": "rarely | weekly | several_per_week | daily",
    "lifestyle": ["outdoor_exercise", "cooks_daily"],
    "sensitivities": ["asthma"],
    "workHours": { "start": "09:00", "end": "17:00" } } }
```
`lifestyle`: `outdoor_exercise, indoor_exercise, cooks_daily, has_pets, eco_focused, budget_conscious`. `sensitivities` (optional, voluntary): `asthma, respiratory, heart, pregnancy, allergies`.

Response:
```json
{ "plan": {
    "air_quality_summary": "…", "risk_level": "low | moderate | high | very_high",
    "daily_recommendations": [{ "time": "Morning | Afternoon | Evening | Night", "action": "…", "reason": "…", "impact": "…" }],
    "indoor_tips": ["…"], "sustainable_actions": ["…"], "important_note": "…" },
  "generatedBy": "rules", "fallbackReason": "no_api_key", "model": null, "dataQuality": { … } }
```
Authenticated callers also get the plan saved to `daily_plans`.

### `POST /api/ai/indoor-recommendations`
```json
{ "location": { … },
  "home": { "sizeSqm": 70, "rooms": 3, "budget": "free | low | medium | high",
            "hasChildren": true, "hasElderly": false, "hasPets": false,
            "ventilation": "good | limited | none", "hasAirConditioner": true,
            "cooksIndoors": true, "usesIncenseOrCandles": false, "smokersInHome": false } }
```
Response `recommendations`: `summary`, `risk_level`, `ventilation_advice{action,reason}`, `purifier_guidance{recommended_cadr_m3h,note}`, `solutions{free[], low_budget[], advanced[]}` (each `{title, detail, why, evidence: strong|moderate|limited, fits_budget}`), `maintenance_reminders[]`, `myths[{myth, reality}]`, `important_note`.
Purifier size = room volume × air-changes-per-hour (4, or 5 when air is poor / children or elders live there), computed on the server.

### `POST /api/ai/mobility-recommendations`
```json
{ "location": { … }, "origin": "Home", "destination": "Office", "distanceKm": 12,
  "preferredMode": "car_petrol", "tripsPerWeek": 5,
  "sensitive": false, "travellingWithChildrenOrElderly": false }
```
Modes: `walk, cycle, e_scooter, metro, bus, carpool, two_wheeler, ev_car, car_petrol, car_diesel`.

Response `result`: `recommended{mode,label,rationale}`, `options[{mode,label,emissionsKg,savedVsPreferredKg,savedVsBaselineKg,minutes,suitability,exposureNote}]` (`suitability`: `recommended | ok | caution | not_advised | impractical`), `weekly{tripsPerWeek,preferredKg,recommendedKg,savedKg}`, `additionalIdeas[]`, `assumptions[]`, `importantNote`. **All numbers are computed deterministically; the LLM may only rewrite narrative text.**

### `POST /api/ai/chat` (BreatheBot)
```json
{ "messages": [{ "role": "user", "content": "Is opening windows a good idea right now?" }],
  "location": { "lat": 28.6139, "lon": 77.209 }, "profile": { "ageGroup": "senior" } }
```
Up to 20 messages (the last 10 are sent to the model); the last must be from the user. `location` and `profile` are optional; without a location the bot says it has no live data instead of guessing.
```json
{ "reply": "**Right now:** AQI **280** (Poor)…", "generatedBy": "rules", "dataQuality": { … } | null,
  "disclaimer": "BreatheBot offers general information, not medical advice…" }
```
### `GET /api/ai/chat/history` — **required auth**
`{ "history": [{ "id", "message", "response", "createdAt" }] }` (last 50). Conversations are stored only if the user has not turned off **saveChatHistory** in their profile.

---

## Impact — required auth

### `POST /api/impact/calculate`
```json
{ "activities": [
    { "type": "metro", "distanceKm": 12, "count": 2, "daysAgo": 0 },
    { "type": "household_habit", "count": 1 } ],
  "save": true }
```
`type`: `walk, cycle, metro, bus, carpool, e_scooter, ev_car, avoided_trip, household_habit`. `distanceKm` per trip (0–500), `count` 1–50, `daysAgo` 0–180 to log a past activity.
```json
{ "items": [{ "type": "metro", "label": "Took metro / train", "trips": 2, "totalKm": 24, "co2SavedKg": 3.24, "fuelSavedL": 1.333 }],
  "totals": { "co2SavedKg": 3.24, "fuelSavedL": 1.33, "sustainableTrips": 2, "habits": 0 },
  "saved": true, "estimate": true, "disclaimer": "…", "assumptions": ["…"] }
```

### `GET /api/impact/history`
Totals (`allTime`, `last7Days`, `last30Days`), `weekly[8]` (`weekStart, co2SavedKg, trips`), `monthly[6]`, `score{value,label}` (0–100), `recent[]`, `disclaimer`, `assumptions`. Score = `min(100, 6×trips + 8×kg CO₂ + 3×habits)` over the last 7 days.

---

## Community

### `POST /api/community/report` — **required auth**, 20/hour
```json
{ "type": "garbage_burning | construction_dust | vehicle_emissions | industrial_smoke | other",
  "description": "10–500 characters", "areaLabel": "Sector 21", "lat": 28.613944, "lon": 77.209021 }
```
`lat`/`lon` are optional and are **rounded to 2 decimals (~1 km) before storage**. Returns `201` with the public report (status `unverified`).

### `GET /api/community/reports?lat=&lon=&limit=` — public
Reports nearest to `lat/lon` first. Public projection only: no user id, coarse coordinates, always labelled.
```json
{ "reports": [{ "id": "…", "type": "construction_dust", "description": "…", "area": "Sector 21", "approxLat": 28.58, "approxLon": 77.32,
                "status": "unverified", "statusLabel": "User-submitted · Unverified until reviewed", "createdAt": "…", "sample": false }],
  "note": "Reports are submitted by community members and have not been independently verified." }
```

---

## User — required auth

### `GET /api/user/profile`
Returns (creating on first call) `{ "profile": { id, name, email, location, ageGroup, occupation, preferences, createdAt }, "demo": false }`.

### `PUT /api/user/profile`
```json
{ "name": "Asha", "ageGroup": "adult", "occupation": "student", "location": { "lat": 28.61, "lon": 77.2, "name": "Delhi" },
  "preferences": { "commute": "metro", "outdoorFrequency": "weekly", "lifestyle": [], "sensitivities": [],
                   "workHours": { "start": "09:00", "end": "17:00" },
                   "notifications": { "highAqiAlerts": true, "dailyPlanReminder": false },
                   "privacy": { "saveChatHistory": true, "saveAqiHistory": true } } }
```
All text is sanitised (markup stripped, length-capped).
