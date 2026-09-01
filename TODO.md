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

## 6. WeatherPeriod/WeatherData types duplicated

`frontend/src/types.ts` and inline types in `backend/src/routes/weather.ts`
and `recommendations.ts` duplicate the same shapes. Consolidate into a
single shared file both sides import from.

## 7. Logging is console.log only

21 call sites across the backend use `console.log`/`console.error`
directly. Introduce structured logging (pino suggested).

## 8. No React error boundary

The frontend has no error boundary, so a render error blanks the whole
app instead of degrading to a message.

## 9. No way to skip the OpenAI call

Every comparison spends OpenAI credits even when the user only wants the
raw weather numbers. Add a path to see the raw comparison without the AI
call.

## 10. LocationAutocomplete.tsx is not an accessible combobox

Missing `role="combobox"`, `aria-expanded`, `aria-activedescendant`.
Arrow-key navigation works visually but screen readers don't announce
suggestions, and the README claims keyboard-navigation accessibility.

## 11. UX niceties

Add a swap-locations button, add recent/favorite searches, and revisit
the fragile `justSelected` flag in `LocationAutocomplete` that suppresses
a re-search after selection.

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
