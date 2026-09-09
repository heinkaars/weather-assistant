# FogCast TODO

Prioritized list of outstanding items for the FogCast repo. First authored 2026-08-28.

## 1. Set ALLOWED_ORIGINS / NODE_ENV on Render

PR #1 (`harden-api-and-add-tests`) adds a CORS allowlist and startup config
validation. Before merging, the repo owner needs to set `ALLOWED_ORIGINS`
(the Vercel frontend URL) and `NODE_ENV=production` on Render, or the
backend will reject all browser traffic or fail to boot. Manual action on
Render, outside the repo — owner only.

## 2. Merge PR #1

`harden-api-and-add-tests` — rate limiting, CORS allowlist, startup
validation, a `formatLocation` bugfix + tests, and CI. Owner decision on
timing/ordering relative to item 1 — not to be merged by the automated
routine.

## 3. Race condition in the Nominatim rate limiter ✅

**Done 2026-08-31.** `backend/src/routes/geocode.ts` checked
`lastRequestTime` and then wrote it in two separate steps, so concurrent
requests could both pass the interval check before either updated the
timestamp, defeating the 1 req/sec limit. Fixed by serializing through a
promise chain (`requestChain` / `reserveRequestSlot`) so each caller
reserves its slot synchronously, before any `await`, instead of
racing on a shared mutable timestamp.

## 4. Backend has no tests ✅

**Done 2026-09-01.** Added a `node:test`-based `test` script to
`backend/package.json` (run via `tsx` for TS support, no new dependency)
covering `enhanceLocationQuery` in `geocode.ts` and `generateCacheKey` in
`cache.ts`. The CORS origin callback and `validateConfig` mentioned below
live in `config.ts`, which only exists on the unmerged `harden-api-and-add-tests`
branch (item 2) — not testable on `main` yet, so left for a future run once
that lands.

## 5. Per-process cache / rate-limit counters (deliberate deferral, not a bug)

`geocodeCache` and the Nominatim rate limiter state are in-process only,
so they don't share state across multiple backend instances/processes.
This is a known, accepted limitation for the current single-process
deployment, documented here so it isn't "fixed" by mistake later.

## 6. WeatherPeriod/WeatherData types duplicated ✅

**Done 2026-09-02.** Added `shared/types.d.ts` as the single canonical
source for `WeatherPeriod`/`WeatherData`, imported via `import type` from
`frontend/src/types.ts`, `backend/src/routes/weather.ts`, and
`backend/src/routes/recommendations.ts` (the old local interfaces are
removed). Used a `.d.ts` declaration file specifically because the backend's
`tsconfig.json` has `rootDir: "./src"`; a `.ts` file outside that directory
trips a `TS6059` rootDir violation on `import type`, but a `.d.ts` (never
emitted) doesn't. Along the way, `recommendations.ts`'s duplicated
`WeatherData` interface turned out to be dead code — it declared a shape
(`location: string`, narrowed `current`/`hourly`) that never matched what
the frontend actually sends (`weather1`/`weather2` are the full
`WeatherData` objects with `location: {lat, lon}`), and the route body
was destructured from untyped `req.body` without ever using the interface.
Replaced it with a real `RecommendationsRequestBody` type built on the
shared `WeatherData`, which now actually types the destructure.

## 7. Logging is console.log only ✅

**Done 2026-09-03.** Added `backend/src/logger.ts` exporting a single
`pino` logger instance (`LOG_LEVEL` env var controls level, default
`info`). Replaced all 16 `console.log`/`console.error` call sites across
`server.ts`, `routes/geocode.ts`, `routes/weather.ts`, and
`routes/recommendations.ts` with `logger.info`/`logger.error` calls,
moving interpolated values into structured fields (e.g.
`logger.info({ lat, lon }, 'Fetching weather')`) instead of template
strings, and passing errors as `{ err: error }` so pino serializes the
stack trace.

## 8. No React error boundary ✅

**Done 2026-09-04.** Added `frontend/src/components/ErrorBoundary.tsx`, a
class-based error boundary (`getDerivedStateFromError` /
`componentDidCatch`) styled consistently with the existing `ErrorMessage`
card. Wrapped `<App />` with it in `main.tsx` so a render error now shows
a "Something went wrong" card with a "Try again" reset button instead of
blanking the whole app to a white screen.

## 9. No way to skip the OpenAI call ✅

**Done 2026-09-07.** `frontend/src/components/Recommendations.tsx` used to
call `fetchRecommendations` (and thus OpenAI) automatically in a `useEffect`
as soon as comparison data loaded, so every comparison spent credits even
if the user only wanted the raw weather numbers already shown in
`WeatherComparison`. Changed it to opt-in: the component now renders a
"Get AI Recommendations" button with a note that it uses OpenAI credits,
and only fetches when the user clicks it.

## 10. LocationAutocomplete.tsx is not an accessible combobox ✅

**Done 2026-09-08.** Added `role="combobox"`, `aria-autocomplete="list"`,
`aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`, and
`aria-activedescendant` to the input in
`frontend/src/components/LocationAutocomplete.tsx`, `role="listbox"` on the
suggestions container with matching `id`, and `role="option"` /
`aria-selected` / stable `id`s on each suggestion button so
`aria-activedescendant` can reference the highlighted option. Also added a
visually-hidden `aria-live="polite"` status span announcing the suggestion
count (or "no suggestions") so screen reader users are told when
suggestions appear, not just sighted users watching the dropdown.

## 11. UX niceties ✅

**Done 2026-09-09.** Added a swap-locations button in `LocationInput.tsx`
between the two fields (disabled when both locations are empty), and a
"Recent searches" chip list (persisted to `localStorage`, last 5 pairs,
deduplicated and most-recent-first) that re-runs a past comparison on
click. Also replaced the fragile `justSelected` boolean in
`LocationAutocomplete.tsx` — a one-shot flag that had to be "consumed" at
exactly the right point in the fetch effect — with a `lastCommittedValue`
ref that the fetch effect compares `inputValue` against directly. This
also made the swap button work correctly: swapping now updates each
field's displayed value (needed a new effect syncing `inputValue` from the
`value` prop, since the input previously only read its initial value once)
without re-triggering a suggestions search, the same problem the old flag
existed to solve for post-selection typing.

## 13. Local directory still named ~/FogCast

Refers to the owner's local machine, not something in the repo. Not
actionable by the automated routine.

---

## Completed

- **2026-08-31** — Item 3: Fixed the Nominatim rate limiter race condition
  in `backend/src/routes/geocode.ts` by serializing requests through a
  promise chain instead of a non-atomic check-then-set on
  `lastRequestTime`.
- **2026-09-01** — Item 4: Added `node:test`-based tests for
  `enhanceLocationQuery` (`backend/src/routes/geocode.ts`) and
  `generateCacheKey` (`backend/src/cache.ts`), plus a `test` script in
  `backend/package.json` (`node --import tsx --test`).
- **2026-09-02** — Item 6: Consolidated `WeatherPeriod`/`WeatherData` into
  `shared/types.d.ts`, imported by both `frontend/src/types.ts` and the
  backend routes that used to redeclare them. Found and fixed a latent bug
  along the way: `recommendations.ts`'s local `WeatherData` interface was
  dead code with a shape that never matched the actual request body; it's
  now replaced with a `RecommendationsRequestBody` type that correctly
  types `req.body`.
- **2026-09-03** — Item 7: Added `backend/src/logger.ts` (a `pino`
  instance) and replaced all 16 `console.log`/`console.error` sites in
  `server.ts`, `routes/geocode.ts`, `routes/weather.ts`, and
  `routes/recommendations.ts` with structured `logger.info`/`logger.error`
  calls.
- **2026-09-04** — Item 8: Added `frontend/src/components/ErrorBoundary.tsx`
  and wrapped `<App />` with it in `main.tsx`, so a render error now
  degrades to a "Something went wrong" message with a reset button instead
  of blanking the app.
- **2026-09-07** — Item 9: `Recommendations.tsx` no longer calls OpenAI
  automatically on mount; it now shows a "Get AI Recommendations" button
  and only fetches when clicked, so viewing the raw weather comparison no
  longer spends API credits.
- **2026-09-08** — Item 10: Added full ARIA combobox semantics
  (`role="combobox"`, `aria-expanded`, `aria-controls`,
  `aria-activedescendant`, `role="listbox"`/`role="option"`, and an
  `aria-live` status span) to `LocationAutocomplete.tsx` so screen readers
  now announce suggestions and the highlighted option, matching the
  existing sighted keyboard-navigation behavior.
- **2026-09-09** — Item 11: Added a swap-locations button and a
  localStorage-backed recent-searches chip list to `LocationInput.tsx`.
  Replaced the fragile `justSelected` one-shot flag in
  `LocationAutocomplete.tsx` with a `lastCommittedValue` ref compared
  against `inputValue`, and added a prop-sync effect so an externally
  changed `value` (e.g. from swapping) updates the field without
  re-triggering a suggestions search.
