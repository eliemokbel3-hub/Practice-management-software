# Exploration: Deployment readiness (Vercel + prod Supabase + reminders cron + env) and mobile navigation — 2026-07-24

## Key Findings

### Files / symbols involved
- `src/app/api/reminders/route.ts` — cron endpoint; exports **POST only**, auth = `Authorization: Bearer ${CRON_SECRET}` header OR a signed-in clinic user ("send now" from Settings).
- `src/middleware.ts` — Supabase-SSR auth guard; exempts `/book`, `/measure`, `/api/reminders`; matcher excludes static assets. Runs fine on Vercel middleware runtime (`@supabase/ssr`).
- `src/lib/email/reminders.ts` — per-clinic reminder run; idempotent via unique index on `email_log` (safe against overlapping runs).
- `src/lib/email/resend.ts` — Resend via raw REST; **no key → sends skipped but still logged** (app degrades gracefully). Has a Windows-only `reg query` fallback for the key (guarded by `process.platform === "win32"`, inert in prod; requires Node runtime, not edge, for the route).
- `src/lib/email/templates.ts` — `appBaseUrl()` = `APP_URL || NEXT_PUBLIC_APP_URL || "http://localhost:3001"` (note: fallback port **3001**, dev runs on 3000) — emailed manage links break unless APP_URL is set in prod.
- `src/lib/data/clinic.ts` / branding — logos stored as data in the `clinics` table (no storage bucket to provision).
- `next.config.ts` — empty; no `vercel.json`; no hosting config anywhere (consistent with Hosting: not deployed).
- `src/app/(app)/layout.tsx` — sidebar `hidden md:flex` + `md:pl-60`; **below `md` there is no navigation UI at all** (no top bar, no drawer). `LogoWatermark` takes `offsetSidebar`.
- `src/components/sidebar-nav.tsx` — nav list component, reusable in a drawer.
- Public `/book` + `/measure` routes have their own layouts (patient-facing, already usable standalone).
- `supabase/migrations/` 0001–0011 + `supabase/seed/seed_tuneup.sql` (seed sets `client_encoding`).

### Codebase integration notes
- **Vercel cron gotcha (fact):** Vercel Cron invokes the configured path with **GET**; the reminders route only exports POST → a `vercel.json` cron alone would 405. Either add a GET handler (same auth) or use an external scheduler that can POST.
- Auth redirect URLs must be added in the Supabase dashboard for the production domain (Supabase Auth setting, not code).
- `npm run build` has not been verified in this exploration — production build health unknown (assumption to validate during execution).
- Env vars needed in prod: the 9 in `.env.example`; local `.env.local` currently holds only the 3 Supabase keys, so email/AI/cron paths are likely untested end-to-end even locally.

### External / API findings
- Resend requires a verified sending domain for a real `RESEND_FROM_EMAIL`; unverified setups are test-only.
- Vercel provides `CRON_SECRET`-style env transparently; cron schedule lives in `vercel.json`.

## Exploration Summary

### Agreed Scope (Build Now) — user-confirmed 2026-07-24: mobile first, deploy after
- Mobile navigation for the app shell: mobile top bar (logo + hamburger) + slide-over drawer reusing `SidebarNav`, theme toggle and sign-out included; per `docs/design-system.md` conventions.
- Calendar on mobile: day view fits the viewport (the `min-w-[640px]` wrapper forces even day view to side-scroll; week view may keep horizontal scroll); header controls verified usable at 375px.
- Mobile audit + fixes of core flows at 375px: patients list/detail, new appointment + booking dialog (currently `max-w-lg` centered — verify usability), notes editor, invoices, settings hub, chat dock (fixed bottom-right — verify it doesn't block content or overflow).

### Deferred — Actionable Later
- Vercel deployment (user decision 2026-07-24: build the mobile site first). Decisions already taken for when it resumes: NEW production Supabase project (migrations 0001–11, Auth redirect URLs); no domain preference — default to vercel.app URL first. Cron findings (GET handler needed, Node runtime, APP_URL) recorded above.
- End-to-end email/AI verification with real keys (Resend, Anthropic) — deferred until keys/domain exist; sends degrade gracefully meanwhile.
- Test safety net (no test script exists at all) — separate initiative after deploy.

### Excluded — Revisit Only If Needed
- Custom domain + DNS — only if the user wants one now; `*.vercel.app` works day one.
- SMS reminders, per-appointment-type comms — feature work, out of deployment scope (see `docs/cliniko-customisation-map.md`).
- Multi-environment setup (staging) — single prod environment is enough at this scale.

### Accepted Assumptions — Revalidate Later
- `npm run build` is close to passing (risk: unknown build errors surface during execution; mitigated by building first).
- The Supabase middleware/auth flow works unchanged on Vercel (standard `@supabase/ssr` pattern; risk low).
- Logos-in-table (no storage bucket) keeps working in prod (risk: row size/perf only at scale).

### Key Design Decisions
- Cron: prefer adding a GET handler with identical Bearer-secret auth to `/api/reminders` so Vercel Cron works natively (rejected: external POST scheduler — extra moving part).
- Reminders route must stay on the Node runtime (the Resend module imports `child_process`; edge would break the import even though the call is win32-guarded).
- Mobile nav reuses `SidebarNav` inside a drawer rather than a second nav list (single source of nav items).
- `appBaseUrl()`'s `localhost:3001` fallback should be corrected/neutralised as part of env wiring (wrong port even for dev).
- Executor-tier concern: Supabase dashboard steps (Auth URLs, prod project creation) are manual/user-performed; the plan must mark them as user tasks, not agent tasks.
