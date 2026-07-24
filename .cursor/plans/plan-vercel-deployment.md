# Feature Implementation Plan
**Feature:** vercel-deployment
**Overall Progress:** `0%`

## Lifecycle State
- Active

## Completion Status
- Completion timestamp:
- Main implementation complete: No
- Ready for archive: No

## Plan Lineage
- Parent plan: plan-mobile-experience.md (this plan consumes its retained "Vercel deployment" + "Email/AI verification" follow-ups)
- Follow-up plans: None

## Goal
Put PracticeHub live on Vercel against a NEW production Supabase project: fix the three
known code blockers (cron GET handler, Node runtime pin, `appBaseUrl` fallback), verify
the production build, provide a minimal production clinic bootstrap (no sample data),
and walk the user through the dashboard-side setup (Supabase prod project + Vercel
project + env vars) to a smoke-tested live app on a `*.vercel.app` URL.

## Planning Extraction Summary

**Workflow Schema:** v22

**Executor tier:** entirely premium — planned and executed in the same premium session; no tier gap

### Agreed Scope (Build Now)
- Cron-compatible reminders endpoint: GET handler with identical `Bearer CRON_SECRET` auth in `src/app/api/reminders/route.ts`; explicit Node runtime pin (route imports `child_process` via `resend.ts`).
- `vercel.json` with a cron schedule for `/api/reminders`.
- Fix `appBaseUrl()` fallback (`localhost:3001` → `localhost:3000`) in `src/lib/email/templates.ts`; production uses `APP_URL`.
- Verify `npm run build` passes; fix build-only issues.
- Production clinic bootstrap (gate disposition 2026-07-24: Include in plan): minimal path creating clinic + owner profile for a fresh prod DB — no fictional sample patients.
- USER dashboard tasks, checklist-guided: new prod Supabase project + migrations 0001–0011 + Auth redirect URLs; Vercel project + all env vars + deploy.
- Live smoke test + email/AI verification with real keys (reminder send via the cron endpoint; one `tidy-note` call).

### Deferred — Actionable Later
- Resend verified sending domain — gate disposition 2026-07-24: Defer
  - Why deferred: requires owning a domain; user has no domain preference — launching on vercel.app
  - Intended future outcome: reminder/booking emails deliverable to real patient addresses from the clinic's own address
  - Relevant files / subsystems: Resend dashboard (DNS records), `RESEND_FROM_EMAIL`
  - Dependencies / prerequisites: a purchased domain
  - Recommended next action: verify domain in Resend, update `RESEND_FROM_EMAIL` — no code change needed
  - Risk if deferred: ux-degradation: production emails only deliver to the account owner's address until then
  - Revisit by: when the user acquires a domain
- Test safety net — carried from plan-mobile-experience (unchanged)
  - Risk if deferred: correctness: no regression protection
  - Revisit by: after this deployment ships
- Clinic self-serve onboarding wizard — carried from plan-mobile-experience (unchanged; the Step-3 bootstrap here is the minimal manual precursor, not the wizard)
  - Risk if deferred: blocked-work: cannot sell to other clinics without it
  - Revisit by: when a second clinic is ready to trial

### Excluded — Revisit Only If Needed
- Staging environment — single prod environment at this scale; revisit if a second contributor or clinic joins.
- Custom domain + DNS — user chose vercel.app first; revisit together with the Resend domain item.

### Accepted Assumptions — Revalidate Later
- `npm run build` is close to passing
  - Why accepted for now: dev server compiles cleanly; lint clean
  - Risk if assumption becomes false: build task absorbs the fixes (it is a task, not a hope)
  - Trigger for revisit: Step 2
- `@supabase/ssr` middleware works unchanged on Vercel
  - Why accepted for now: standard documented pattern
  - Risk if assumption becomes false: low; smoke test catches it
- Logos stored in the DB (no storage bucket) remain fine at production scale
  - Trigger for revisit: clinic logo upload performance complaints

### Key Design Decisions
- Vercel (user-confirmed 2026-07-24); NEW production Supabase project (user-confirmed); `*.vercel.app` URL first
  - Alternatives rejected: Railway (external-POST cron model); promoting the dev Supabase project (mixes test data with real patient data)
- GET handler on the existing route rather than an external POST scheduler
  - Why: Vercel Cron sends GET and auto-attaches `Authorization: Bearer $CRON_SECRET` when that env var is set — zero extra moving parts
  - Alternatives rejected: cron-job.org/external scheduler (extra service to manage)
- All dashboard/console steps and every secret value are USER-performed; the agent writes code, config, and checklists only
- Production bootstrap excludes sample patients — aligned with the multi-clinic SaaS vision (fresh clinic starts clean; see memory `practicehub-saas-vision`)

## Key Findings

### Files / Symbols Involved
- `src/app/api/reminders/route.ts` — exports POST only; auth = `Bearer CRON_SECRET` header OR signed-in profile; middleware exempts the path
- `src/lib/email/resend.ts` — imports `child_process` (win32-only `reg query` fallback, inert in prod) → the route must stay on the Node runtime
- `src/lib/email/templates.ts` — `appBaseUrl()`: `APP_URL || NEXT_PUBLIC_APP_URL || "http://localhost:3001"` (dev runs on 3000 — fallback wrong)
- `src/lib/email/reminders.ts` — idempotent via unique index on `email_log`; safe under overlapping cron runs
- `supabase/seed/seed_tuneup.sql` — dev seed (clinic + owner + SAMPLE patients; sets `client_encoding`); prod bootstrap derives from its clinic/profile portion only
- `supabase/migrations/` 0001–0011 — full schema; `supabase` CLI is a devDependency
- `next.config.ts` — empty; no `vercel.json` exists yet

### Codebase Integration Notes
- Vercel Cron: requests are GET; `Authorization: Bearer $CRON_SECRET` is auto-attached when the env var exists. Hobby-tier cron is limited to once daily — hourly schedules need Pro (see Task 1.3 note).
- Route handlers default to the Node runtime in this Next version — the pin is a guard against future edge migration, not a behavior change.
- A fresh prod Supabase project has NO clinic/profile rows after migrations; sign-in works (auth user) but the app expects a `clinics` row + owner `profiles` row — the Step 3 bootstrap provides them.
- Supabase Auth redirect URLs (dashboard → Authentication → URL Configuration) must include the vercel.app origin, or auth callbacks fail in prod.
- Email degrades gracefully without keys (skipped but logged in `email_log`) — a half-configured deploy still works minus email.

### External / API Findings
- Resend without a verified domain delivers only to the account owner's email (from `resend.dev`) — recorded as the deferred domain item.

## Planned Workflow Summary

### Flow 1 — Scheduled reminders in production
- Vercel Cron GETs `/api/reminders` with the bearer secret → `sendDueReminders()` scans clinics with reminders on → sends due emails via Resend → `email_log` guarantees once-only.

### Flow 2 — Fresh production sign-in
- User creates the auth user in Supabase → runs the clinic bootstrap → signs in at the vercel.app URL → lands in a clean clinic (no sample data) ready for real configuration.

## Design Decisions
- Decision 1 — GET handler keeps the existing POST intact because the Settings "send now" path posts with a session; both share one auth check because the secret path must never weaken. Alternatives considered: separate cron route (rejected — duplicate auth surface).
- Decision 2 — Bootstrap ships as a documented, idempotent script/SQL under `scripts/` (values via env/args, never hard-coded) rather than editing the dev seed — the dev seed stays a dev artifact.

## Schema / Data Changes
- None to schema. One-time prod data bootstrap: `clinics` row + owner `profiles` row (Step 3/4).

## Config / Environment / Deployment Impact
- New file: `vercel.json` (cron schedule).
- Vercel env vars (values user-entered in the dashboard, names from `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (prod project values), `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `APP_URL` + `NEXT_PUBLIC_APP_URL` (= the vercel.app URL), `CRON_SECRET` (generate a long random string).
- Supabase dashboard: Auth redirect URLs for the vercel.app origin.
- Release risk: reminders mis-schedule silently if `CRON_SECRET` differs between Vercel env and the cron header expectation — same var covers both by design.

## Critical Constraints
- The agent NEVER handles secret values — user enters all keys in dashboards; nothing secret is committed (`.env*` stays gitignored except `.env.example`).
- The secret-auth check on `/api/reminders` must remain exactly as strict on GET as on POST.
- Production bootstrap must contain zero sample/fictional data (SaaS-vision constraint).
- No schema changes in this plan.

## Validation / Verification
- `npm run build` completes with zero errors (Step 2 gate).
- `npx eslint src` clean.
- Local: `curl -H "Authorization: Bearer <secret>" http://localhost:3000/api/reminders` (GET) returns the run result JSON; wrong/missing secret → 401.
- Live smoke (user + agent checklist): login page renders on the vercel.app URL; sign-in works; dashboard/calendar/patients load; `/book/<slug>` public page renders logged-out.
- Email/AI verification: cron endpoint triggered once live → `email_log` rows appear (delivery to owner address OK pre-domain); one clinical-note tidy call succeeds.

## Deferred / Out of Scope
See `Planning Extraction Summary` → Deferred / Excluded (single source; not duplicated here).

## Current State / Handoff Note
- Last completed step: Planning complete
- Current in-progress step: None
- Immediate next action: `/execute`
- Open blockers / open questions: None
- Last plan sync: 2026-07-24 (hardened via /review-plan — runtime pin verified against Next 16 docs; maxDuration guard added; env-before-first-deploy note added to Step 5)

## Review History
- (no reviews yet)

## Review Findings Log
- (no findings logged yet)

## Tasks

- [ ] 🟥 Step 1: Code fixes for Vercel
  - [ ] 🟥 1.1: `src/app/api/reminders/route.ts` — add `GET` export sharing the exact bearer-secret check (secret-only; no signed-in-user path on GET), keep POST unchanged; add `export const runtime = "nodejs"` and `export const maxDuration = 60` (verified in Next 16 route-segment-config docs; the duration guard keeps a busy sequential reminder run from being killed by the platform default)
    - Expected: `curl` GET with the secret returns the run-result JSON; without it, 401
  - [ ] 🟥 1.2: `src/lib/email/templates.ts` — `appBaseUrl()` fallback → `http://localhost:3000`
  - [ ] 🟥 1.3: Create `vercel.json` with a cron entry for `/api/reminders`. Schedule note: Hobby tier allows daily only (e.g. `0 8 * * *` ≈ morning AEST reminder run); hourly (`0 * * * *`) needs Pro — pick at execution based on the user's Vercel tier and record inline
- [ ] 🟥 Step 2: Production build — run `npm run build`; fix anything build-only (types, dynamic APIs); re-run to green
  - Verification: build exits 0; no new lint errors
- [ ] 🟥 Step 3: Production clinic bootstrap — new `scripts/bootstrap-clinic.mjs` (or documented SQL in `docs/`): creates `clinics` row + owner `profiles` row bound to an existing auth user (id via arg/env); idempotent; ZERO sample patients; usage documented in the script header (see Design Decision 2)
- [ ] 🟥 Step 4: [user] Production Supabase — create project; `supabase link` + push migrations 0001–0011; add vercel.app origin to Auth redirect URLs; create the owner auth user; run the Step 3 bootstrap. Agent provides the exact command checklist; user executes and reports back
- [ ] 🟥 Step 5: [user] Vercel — create project from the GitHub repo; enter ALL env vars from Config / Environment BEFORE triggering the first deploy (`NEXT_PUBLIC_*` values are baked at build time — deploying first means an immediate redeploy); deploy. Agent provides the checklist; user reports the deployed URL
- [ ] 🟥 Step 6: Live verification — run the Validation / Verification live-smoke + email/AI checks against the deployed URL; fix anything found (code fixes loop through Steps 1–2 conventions)
- [ ] 🟥 Step 7: Close-out — update `AGENTS.md` Hosting row to Vercel (`source=config:vercel.json` once the file exists and the deploy is confirmed), Links section (live URL), Current Status; `CHANGELOG.md` entry

## Retained Follow-Up Items
- N/A — plan is Active (populated at completion review)

## Follow-Up Continuation Notes
- After this plan: Resend domain verification when a domain exists; then the test safety net; then onboarding-wizard exploration
- Design decisions that persist: SaaS/multi-clinic constraint; user-performs-all-secrets boundary
- Do not rediscover: Vercel cron GET + auto-bearer behavior; Hobby daily-cron limit; fresh-DB needs clinic bootstrap; Resend no-domain delivery limit

---
*Plan saved to: .cursor/plans/plan-vercel-deployment.md*
*To resume in a new session: open a fresh Agent (Ctrl+I), run /start-session, then run /load-plan*
