# Architecture and code organisation

This document explains how the code is organised and why, so a reader can find things quickly and change them safely.

## Principles

1. **Facts are computed, wording is generated.** AQI, risk levels, purifier sizes, emissions and savings come from deterministic code. An LLM (optional) only writes explanations, and its output is validated and screened before use.
2. **One implementation of every endpoint.** Endpoint logic lives in transport-agnostic functions (`server/src/core`). Express calls them on the server; the GitHub Pages build calls the same functions in the browser.
3. **Small units with one job.** Pages compose small components; services are split by responsibility; key modules begin with a short comment saying what they are for.
4. **Dependencies are injected.** Services receive their collaborators (store, air-quality service, LLM client, clock), which is what makes the fast, deterministic tests possible.
5. **Safe by default.** Untrusted input is validated (zod) and sanitised at the edge; secrets exist only in server environment variables.

## Server (`server/src`)

| Folder | Responsibility |
|---|---|
| `routes/` | Thin Express adapters: pick middleware (auth, rate limits), call a handler, set the HTTP status. No business logic. |
| `core/` | The endpoint logic, one file per feature area (`environment`, `recommendations`, `impact`, `community`, `profile`), composed in `handlers.ts`. Must not import Express or vendor SDKs. |
| `services/airQuality/` | Air-quality lookups: `liveSource` (OpenWeather), `simulatedSource` (labelled demo data), `result` (shared assembly, daily averages), `index` (10-minute cache). |
| `services/ai/` | The recommendation engine: one module per feature (`dailyPlanFeature`, `indoorFeature`, `mobilityFeature`, `chatFeature`), plus `generate` (LLM → schema → safety screen → fallback), `guardrails` and `outputSchemas`. |
| `services/rules/` | The deterministic rules engine that powers demo mode and every fallback. Each builder is a set of small functions (for example one per time of day). |
| `services/` (other) | `impact` (emission maths), `weather`, `openweather` (validated HTTP client), `simulated` (deterministic generator). |
| `store/` | `Store` interface with in-memory and Supabase implementations. |
| `middleware/` | Authentication (Supabase JWT or demo token), request ids and logging, rate limiting, 404 and central error handling (security headers are applied in `app.ts`). |
| `lib/` | Pure helpers: AQI maths, emission factors, geo, sanitising, TTL cache, redacting logger, error types. |
| `prompts/` | Prompt templates, including the BreatheBot system prompt. |
| `schemas.ts` | Every request schema (zod); the single source of truth for input validation. |

### Request flow

```
HTTP request → routes/ (auth, rate limit) → core/ handler → validate (schemas.ts)
            → services (air quality, AI pipeline, impact) → store → JSON response
```

### The AI pipeline (`services/ai/generate.ts`)

`LLM JSON → zod schema → safety screen → server-side finalize → response`, falling back to `services/rules` at any failure. Every response reports `generatedBy` and `fallbackReason`, so the UI can be honest about what produced an answer.

## Client (`client/src`)

| Folder | Responsibility |
|---|---|
| `pages/` | One file per route. Each page only fetches data and arranges feature components. |
| `components/<feature>/` | Feature components and hooks (`planner`, `indoor`, `mobility`, `impact`, `community`, `dashboard`, `location`). Forms, result views and charts are separate small components. |
| `components/ui/` | Generic building blocks (button, card, form fields, tabs, feedback). |
| `lib/` | Typed API client, request hook (`useAsync`, abortable), AQI helpers, safe storage. |
| `context/` | Authentication and selected-location state. |
| `static/` | The in-browser backend used by the GitHub Pages build; it only wires `server/src/core` to in-memory services. |

## Testing

- **Server:** unit tests for pure logic (AQI maths, emissions, rules, guardrails, cache, logger) and HTTP-level tests of the real Express app (auth, validation, rate limiting, privacy).
- **Client:** component and page tests, API-client tests, tests of the in-browser backend, and an automated accessibility audit (axe-core) of every page.
- **Tooling:** ESLint (with accessibility rules), Prettier, strict TypeScript, coverage thresholds and a dependency audit, all enforced in CI.
