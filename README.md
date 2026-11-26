# BreatheWise AI – Urban Air Quality Assistant

A smart assistant that turns air-quality data into **practical, personalised, safety-conscious decisions**: when to go out, how to protect your home, how to travel, and how to cut your own emissions.

**Live demo:** https://sweetyvincent.github.io/breathewise-ai/ (GitHub Pages, runs entirely in the browser with clearly-labelled simulated data).

> **Try it in 60 seconds, no API keys needed.** The app ships with a clearly-labelled **Demo Mode** (simulated data + a rules-based assistant), so judges can explore every feature offline. Add keys to switch to live data and GenAI.

---

## 1. Chosen vertical

**Environmental health & sustainable urban living** (smart-city air quality).
Target users: city residents (e.g. Delhi NCR, Mumbai, Bengaluru) who see an AQI number but don't know what to *do* about it, especially children, older adults, outdoor workers and people with respiratory or heart conditions.

## 2. Approach and logic

The central design decision: **facts are computed by deterministic code; the AI explains and personalises.**

| Concern | How it is handled |
|---|---|
| AQI | Computed from raw pollutant concentrations using **India CPCB NAQI breakpoints** (0–50 Good … 401–500 Severe). The provider's 1–5 index is never mixed in. It is *indicative* (official NAQI uses 24 h averages). |
| Context-based decisions | A rules engine reads AQI category, dominant pollutant, forecast, time of day and the user profile (age, occupation, commute, sensitivities). `cautionLevel` escalates one level for sensitive users. |
| Cleanest time window | Derived from the provider's hourly forecast (or the labelled simulated pattern). |
| Purifier size | Room volume × air changes per hour (4, or 5 when air is poor or children/elders live there). |
| Mobility | Emissions, minutes and savings are **server-calculated**. Exposure rules stop the app recommending walking/cycling in severe air (a 3 km trip at AQI 420 gets transit, not a walk). The LLM may only rewrite narrative. |
| GenAI safety | LLM returns JSON → **zod schema validation** → **safety screen** (rejects absolute safety claims, diagnosis, "plants clean the air", invented AQI numbers) → server overrides risk level / numbers → on any failure **falls back to the rules engine**. Responses say which path produced them (`generatedBy`, `fallbackReason`). |
| No fabrication | If a live provider fails the API returns 503; it never invents readings. Simulated data appears only in Demo Mode and is labelled everywhere. |

## 3. How it works

```
React + Vite + TS (Tailwind, shadcn-style UI, Recharts)
        │  /api  (typed client, abort-able requests, friendly errors)
        ▼
Express 5 + TypeScript ── helmet · CORS allow-list · rate limits · zod validation · sanitising · redacting logger
   ├─ core/handlers.ts   → transport-agnostic endpoint logic (shared by Express and the GitHub Pages build)
   ├─ AirQualityService  → OpenWeather (validated) → NAQI → 10-min TTL cache   | simulator (demo)
   ├─ AI pipeline        → OpenAI (JSON) → schema → safety screen → finalize    | rules engine (fallback)
   ├─ ImpactService      → illustrative emission factors → score
   └─ Store              → Supabase (RLS) | in-memory (demo)
```

**Modules (8) → pages (11)**

| Module | Page | Highlights |
|---|---|---|
| Smart AQI dashboard | `/app` | AQI gauge, scale legend, pollutant breakdown, 24 h + 7-day charts (with table alternative), freshness timestamp, **live / forecast / simulated** distinction |
| AI daily planner | `/app/planner` | Morning/afternoon/evening/night actions with reasons and impact; sensitivity-aware |
| Breathe Better Indoors | `/app/indoor` | Free / low-budget / advanced tiers, evidence rating, purifier sizing, myths vs evidence, mask/purifier limits |
| Sustainable mobility | `/app/mobility` | Mode comparison with exposure vs emissions shown separately |
| BreatheBot | `/app/chat` | Context-grounded chat, suggested prompts, safe markdown |
| Impact tracker | `/app/impact` | Estimated CO₂/fuel saved, weekly trend, score. States clearly that personal savings do **not** change local AQI |
| Community hub | `/app/community` | Reports labelled *user-submitted · unverified*; area-level only |
| Education center | `/app/learn` | AQI scale, pollutants, myths, masks vs purifiers |
| Plus | `/`, `/auth`, `/app/settings` | Landing, sign-in (Supabase or demo), profile & privacy |

### Generative AI usage

- **Built with Claude (Anthropic, via Claude Code):** architecture, front-end and back-end code, tests, CI workflows and documentation were produced with Claude and reviewed and deployed by the author.
- **In the product (OpenAI API, optional, server-side only):** the daily planner and indoor recommendations (structured JSON), the narrative text of mobility advice (numbers are always computed by the server), and the BreatheBot chat (system prompt in `server/src/prompts/index.ts`). Every response is schema-validated and safety-screened, with a deterministic rules-engine fallback.
- **The GitHub Pages demo calls no external AI service.** It uses the rules engine, so it needs no keys. OpenAI is used only when a backend is deployed with `OPENAI_API_KEY`.

## 4. Quick start (Demo Mode, no keys)

Requires Node 20+.

```bash
npm run install:all
cp server/.env.example server/.env      # defaults work: demo mode
npm run dev:server                      # API  → http://localhost:8787
npm run dev:client                      # UI   → http://localhost:5173
```
Open the UI and click **Try the live demo**. Everything works with simulated data.

## 5. Live mode

Set in `server/.env` (see `server/.env.example`):

| Variable | Purpose |
|---|---|
| `OPENWEATHER_API_KEY` | Live air quality, forecast, weather, geocoding |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | GenAI recommendations and chat |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Persistence + JWT verification |
| `CORS_ORIGINS` | Comma-separated front-end origins |
| `DEMO_MODE` | `true` keeps demo login + simulated option available (judges) |

Client (`client/.env.example`): `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (the **anon** key only; no secret ever reaches the browser). Each feature degrades independently: no OpenAI key → rules engine; no OpenWeather key → demo data, labelled; no Supabase → in-memory store.

## 6. Deployment

### Option A: GitHub Pages only (no server, no accounts)

GitHub Pages serves static files, so this build runs the **whole app in the browser in demo mode**: the server's transport-agnostic handlers (`server/src/core/handlers.ts`: the same validation, simulator, rules engine and impact maths the Express routes call) are bundled into the front end (`client/src/static/`), data is simulated and labelled, and nothing leaves the browser. Demo-session data lives in memory and resets on reload.

1. Push the repo to GitHub (branch `main`).
2. In the repo go to **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The `Deploy to GitHub Pages` workflow runs on every push and publishes to `https://<user>.github.io/<repo>/`.

Local preview: `npm --prefix client run build:pages && npx serve client/dist-static`. URLs use a hash (`#/app/planner`) because Pages cannot rewrite unknown paths.
Not available in this mode (needs the server): live OpenWeather data, OpenAI answers, Supabase accounts and persistence.

### Option B: Full stack (live data, GenAI, accounts)

1. **Supabase:** create a project, run `supabase/schema.sql` (tables: users, aqi_history, daily_plans, chat_history, impact_records, community_reports; RLS on; a public view without user ids).
2. **Backend → Render:** connect the repo; `render.yaml` configures root dir, build, start and `/api/health`. Add env vars in the dashboard.
3. **Frontend → Vercel or Netlify:** root dir `client`; `vercel.json` / `netlify.toml` provide SPA rewrites. Set `VITE_API_URL` to the Render URL; add the front-end origin to `CORS_ORIGINS`.

CI (`.github/workflows/ci.yml`) typechecks, lints, format-checks, tests (with coverage thresholds), audits and builds both packages on every push.

## 7. API documentation

See [`docs/API.md`](docs/API.md) for all endpoints, auth, request/response examples and error shapes, and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how the code is organised and why.

## 8. Testing

```bash
npm test             # server (142 tests) + client (54 tests)
npm run lint         # ESLint (TypeScript, React hooks, jsx-a11y accessibility rules)
npm run typecheck
npm --prefix server run coverage   # ~95% statement coverage, thresholds enforced in CI
npm --prefix client run coverage
npm run build
```
Server tests cover NAQI maths, the simulator, rules (e.g. *no walking recommendation in severe air*), guardrails, emissions, and the HTTP API (auth, validation, rate limiting, privacy). Client tests cover components, the API client, pages, the in-browser (GitHub Pages) backend, and an **automated accessibility audit (axe-core) of every page** against the real handlers.

## 9. Security

- No secrets in code or the client bundle; `.env.example` only; `.gitignore` excludes `.env`.
- Helmet, CORS allow-list, body limit 50 KB, rate limits (general 120/min, AI 15/min, writes 20/h).
- Every input validated by zod; free text sanitised; LLM output validated and screened; provider responses validated.
- Supabase RLS; JWT verified server-side; demo tokens are isolated per tab and off in production unless `DEMO_MODE=true`.
- Privacy: report coordinates rounded to ~1 km, no user id in public data, optional chat/AQI history saving, logger redacts tokens, keys and message bodies.
- Safe markdown renderer (no HTML injection).
- Production Content-Security-Policy (no inline scripts, no third-party origins), `npm audit` clean for production dependencies and enforced in CI (`--audit-level=high`).

## 10. Accessibility

Verified two ways: `eslint-plugin-jsx-a11y` rules in the lint step, and an automated axe-core audit of every page in the test suite. Skip link and landmarks; keyboard-operable controls; visible focus; `aria-live` for results and errors; charts have a text/table alternative; colour is never the only signal (labels + icons); AA-contrast category colours; native selects; `prefers-reduced-motion` respected; responsive down to phone width.

## 11. Assumptions and limitations

- AQI is **indicative**: computed from current concentrations; official NAQI uses 24 h averages.
- Emission factors are **illustrative** (g CO₂e per passenger-km: petrol car 170, diesel 160, two-wheeler 70, bus 60, carpool 57, metro 35, e-scooter 25, EV 95, walk/cycle 0); baseline is a solo petrol car at 0.07 L/km. Impact figures are estimates; **personal savings do not change local AQI**.
- The simulator is a plausible daily pattern per city profile, not a forecast, and is always labelled.
- Masks and purifiers: only well-fitted respirators and sized HEPA purifiers reduce particles; neither removes gases or replaces official advice.
- Not medical advice; no diagnosis; users are told to follow official advisories and their doctor.
- Community reports are unverified user submissions and not a measurement.
- Demo data is held in memory and resets on restart.

## 12. Project layout

```
client/src/pages/           One file per route; pages only fetch data and arrange components
client/src/components/      Feature components and hooks (planner, indoor, mobility, impact, community, dashboard, location) and ui/ primitives
client/src/static/          In-browser backend for GitHub Pages (wires server/src/core to in-memory services)
server/src/routes/          Thin Express routes (auth, rate limits, HTTP status)
server/src/core/            Transport-agnostic endpoint logic, one file per feature area (shared by Express and the Pages build)
server/src/services/        Air quality (live/simulated/cache), AI pipeline, rules engine, impact, weather
server/src/store/           In-memory and Supabase stores
server/tests/               Server tests
supabase/                   schema.sql
docs/                       API.md, ARCHITECTURE.md
render.yaml  .github/workflows/{ci,pages}.yml  LICENSE (MIT)
```
