# Feature Implementation Plan
**Feature:** mobile-experience
**Overall Progress:** `100%`

## Lifecycle State
- Completed — Follow-ups Retained

## Completion Status
- Completion timestamp: 2026-07-24
- Main implementation complete: Yes
- Ready for archive: No (follow-ups retained)

## Plan Lineage
- Parent plan: None
- Follow-up plans: None

## Goal
Make PracticeHub genuinely usable on phones (375px) for both staff and patients: add the
missing mobile navigation to the app shell, make the calendar day view fit the viewport,
and audit + fix all core staff flows and the public booking/measure pages at mobile widths.
Built with the multi-clinic SaaS vision in mind — nothing clinic-specific, everything on
the existing design system.

## Planning Extraction Summary

**Workflow Schema:** v22

**Executor tier:** entirely premium — planned and executed in the same premium session; no tier gap

### Agreed Scope (Build Now)
- Mobile app-shell navigation: top bar (logo + hamburger) below `md` in `src/app/(app)/layout.tsx`, slide-over drawer reusing `SidebarNav`, theme toggle + sign-out included, styled per `docs/design-system.md`.
- Calendar mobile fit: day view renders within a 375px viewport (no forced 640px min-width); week view keeps intentional horizontal scroll; header controls usable at 375px.
- 375px audit + fix pass over staff flows: patients list/detail, new appointment + booking dialog, notes editor, invoices, settings hub, messages, chat dock.
- 375px audit + fix pass over PUBLIC patient pages: `/book` online-booking flow, `/book/manage/[token]`, `/measure/[token]` outcome forms (gate disposition 2026-07-24: Include in plan — highest-stakes mobile surfaces for a sellable SaaS).

### Deferred — Actionable Later
- Vercel deployment (user decision 2026-07-24: mobile first, deploy after)
  - Why deferred: user wants the mobile site built before launching online
  - Intended future outcome: app live on Vercel with reminders cron running
  - Relevant files / subsystems: `src/app/api/reminders/route.ts`, `next.config.ts`, (new) `vercel.json`, Supabase dashboard
  - Dependencies / prerequisites: this plan complete; NEW production Supabase project (user-confirmed choice) with migrations 0001–11 + Auth redirect URLs; no domain preference — vercel.app URL first
  - Recommended next action: new plan from `.cursor/plans/explore-deploy-vercel-mobile-nav.md` Key Findings (cron GET handler needed — Vercel Cron sends GET, route only exports POST; route must stay Node runtime — `resend.ts` imports `child_process`; `APP_URL` must be set — `appBaseUrl()` falls back to `localhost:3001`)
  - Risk if deferred: blocked-work: app remains local-only; no real-clinic feedback
  - Revisit by: when this plan reaches `Completed`
- Email/AI end-to-end verification with real keys (Resend, Anthropic) — gate disposition 2026-07-24: Defer
  - Why deferred: belongs with deployment prep; sends degrade gracefully (skipped but logged)
  - Intended future outcome: reminder emails and note-tidying verified live
  - Relevant files / subsystems: `src/lib/email/`, `src/lib/ai/tidy-note.ts`, `.env.example`
  - Dependencies / prerequisites: Resend key + verified sending domain; Anthropic key; `CRON_SECRET`
  - Recommended next action: fold into the deployment plan as tasks
  - Risk if deferred: ux-degradation: reminders/tidying untested until deploy prep
  - Revisit by: deployment plan kickoff
- Test safety net (repo has no test script) — gate disposition 2026-07-24: Defer
  - Why deferred: an initiative of its own; bundling would bloat this plan
  - Intended future outcome: test infra + coverage of billing/availability logic
  - Relevant files / subsystems: `package.json`, `src/lib/booking/availability.ts`, `src/lib/data/invoices.ts`
  - Dependencies / prerequisites: none
  - Recommended next action: own plan after deployment
  - Risk if deferred: correctness: refactors run without regression protection
  - Revisit by: after deployment ships
- Clinic self-serve onboarding wizard (SaaS vision, stated 2026-07-24)
  - Why deferred: major feature; not mobile scope
  - Intended future outcome: a fresh clinic sets everything up from scratch on first access (details, users, appointment types, billables, templates, branding)
  - Relevant files / subsystems: settings suite, `clinics`/`profiles` tables, auth signup flow
  - Dependencies / prerequisites: deployment; multi-clinic signup story
  - Recommended next action: `/explore` onboarding when prioritised
  - Risk if deferred: blocked-work: cannot sell to other clinics without it
  - Revisit by: when a second clinic is ready to trial

### Excluded — Revisit Only If Needed
- Custom domain + DNS + Resend domain verification
  - Why excluded: no user preference; vercel.app URL works day one
  - When to revisit: deployment plan
  - Relevant files / subsystems: Vercel dashboard, Resend dashboard, `APP_URL`
- SMS reminders, per-appointment-type comms, staging environment
  - Why excluded: feature work outside mobile scope (see `docs/cliniko-customisation-map.md`)
  - When to revisit: post-deployment feature planning
- Bottom-tab navigation pattern (native-app-style)
  - Why excluded: drawer + top bar is the lighter first version consistent with the current shell; tabs would duplicate nav sources
  - When to revisit: only if real mobile usage shows the drawer is too slow for daily front-desk use

### Accepted Assumptions — Revalidate Later
- `md` (768px) remains the mobile/desktop cutover
  - Why accepted for now: existing convention throughout the shell
  - Risk if assumption becomes false: minimal — utilities are per-breakpoint
  - Trigger for revisit: tablet-specific complaints
- Mobile work is purely client/UI — no schema or server changes
  - Why accepted for now: exploration found no server dependency in any scoped surface
  - Risk if assumption becomes false: low — a surprise server need becomes a scope-expansion finding at review
  - Trigger for revisit: any task needing a server change → route through `/review` scope-expansion

### Key Design Decisions
- Multi-clinic SaaS mindset (user, 2026-07-24): PracticeHub will be sold to other clinics, Cliniko-style; nothing clinic-specific may be hard-coded; every surface must work for a fresh clinic with zero data
  - Why: product direction — see memory `practicehub-saas-vision`
  - Alternatives rejected: building for the user's own clinic only
  - Still applies to follow-up work: Yes
- Drawer reuses `SidebarNav` — single source of nav items
  - Why: no second nav list to drift out of sync
  - Alternatives rejected: separate mobile nav array
  - Still applies to follow-up work: Yes
- All mobile fixes use existing design-system tokens/classes (`docs/design-system.md`)
  - Why: one visual language; `globals.css` owns the values
  - Alternatives rejected: ad-hoc mobile styles
  - Still applies to follow-up work: Yes
- Booking-dialog mobile presentation is a `[decision]` task, not an assumption
  - Why: centered `max-w-lg` may or may not survive 375px with tweaks; decide after seeing it live
  - Alternatives rejected: baking in "centered is fine"
  - Still applies to follow-up work: Yes

## Key Findings

### Files / Symbols Involved
- `src/app/(app)/layout.tsx` — app shell; sidebar `hidden md:flex` + `md:pl-60`; **no nav below `md` at all**; hosts `LogoWatermark` (`offsetSidebar`), `ChatDock`
- `src/components/sidebar-nav.tsx` — nav items list (client component); reused by the drawer
- `src/app/(app)/calendar/page.tsx` — grid wrapped in `overflow-x-auto` + `min-w-[640px]` (line ~132) forcing side-scroll even in day view; header rows already `flex-wrap`; day/week toggle via `?view=`
- `src/components/calendar/booking-dialog.tsx` — `fixed inset-0` centered, `max-h-[90vh] w-full max-w-lg overflow-y-auto`; zero responsive prefixes
- `src/components/calendar/day-column.tsx`, `manage-dialog.tsx` — zero responsive prefixes
- `src/components/chat-dock.tsx` — `fixed bottom-0 right-0 z-40`; zero responsive prefixes; may overlap content at 375px
- Staff pages: `src/app/(app)/patients/page.tsx` + `[id]`, `notes/[id]`, `invoices/`, `settings/page.tsx`, `messages/page.tsx` — tables already in `overflow-x-auto` cards
- Public: `src/app/book/[slug]/page.tsx`, `book/components/booking-flow.tsx` + `slot-picker.tsx`, `book/manage/[token]/`, `measure/[token]/` — own layouts, unaudited at 375px

### Codebase Integration Notes
- Execution finding (2026-07-24): the shell content column (`(app)/layout.tsx`) needed `min-w-0` — as a `flex-1` child of the row-flex shell, `min-width:auto` let wide children (week calendar grid) inflate the page instead of scrolling inside their `overflow-x-auto` wrappers. This fix also protects all wide tables at mobile widths.
- Design system: `.card`, `.btn-primary/.btn-secondary`, `.input-base`, `.section-label`, fade-up motion — all in `src/app/globals.css`; conventions in `docs/design-system.md`
- Clinic branding overrides `--primary` family via `brandThemeCss` — new UI must use tokens, never literal colors
- The drawer needs a small client component (open/close state); the shell layout is a server component — keep the boundary clean (drawer = client, layout stays server)
- `LogoWatermark offsetSidebar` assumes the 240px sidebar — verify watermark placement on mobile (no sidebar)
- Print styles exist (`print:hidden` on sidebar) — the mobile top bar must also be `print:hidden`

### External / API Findings
- N/A — no external APIs in mobile scope (deployment findings live in the Deferred item + explore scratch)

## Planned Workflow Summary

### Flow 1 — Staff on a phone
- Opens the app → top bar with hamburger → drawer slides in with full nav + theme + sign-out → navigates to calendar (day view fits screen) → books/edits appointments via mobile-usable dialogs → checks patients/invoices/notes without horizontal jank.

### Flow 2 — Patient on a phone (public)
- Opens the clinic's `/book` link → completes the booking flow comfortably at 375px → manages the booking from the emailed link → fills `/measure` outcome forms.

## Design Decisions
- Decision 1 — Top bar + slide-over drawer (not bottom tabs) because it reuses `SidebarNav` verbatim and matches the existing shell; bottom tabs would fork the nav source. Alternatives considered: bottom tab bar (rejected: duplicate nav, more surface).
- Decision 2 — Day view becomes the sensible mobile calendar (fits viewport); week view intentionally keeps horizontal scroll behind `overflow-x-auto` because 7 columns can never fit 375px legibly. Alternatives considered: responsive week collapse (rejected: complexity for little value).
- Decision 3 — Booking-dialog presentation at 375px decided at execution via `[decision]` task (centered-with-tweaks vs bottom-sheet).

## Schema / Data Changes
- N/A — client/UI only (Accepted Assumption; any exception routes through scope-expansion)

## Config / Environment / Deployment Impact
- None in this plan. Deployment impacts are recorded under Deferred (cron GET handler, Node runtime, `APP_URL`, new prod Supabase project).

## Critical Constraints
- No hard-coded clinic specifics; tokens/classes only — clinic branding must keep cascading (SaaS vision)
- `md` (768px) is the cutover; desktop (≥768px) must be pixel-identical to today — mobile work adds below-`md` behaviour, it never alters desktop
- Shell layout stays a server component; interactivity isolated in small client components
- Mobile top bar and drawer are `print:hidden`
- Respect `prefers-reduced-motion` for drawer transitions (pattern exists in `globals.css`)

## Validation / Verification
- `npx eslint src` clean; dev server compiles with no errors
- Browser-pane checks at 375×812 (mobile), 768×1024, 1280×800, light + dark:
  - every app page reachable via drawer; no page relies on the hidden sidebar
  - no horizontal body scroll anywhere except intentional wrappers (week calendar, wide tables)
  - calendar day view fully visible at 375px; slots tappable
  - booking dialog usable (per recorded decision); forms submittable
  - chat dock does not block primary actions at 375px
  - `/book` end-to-end and `/measure` form at 375px
- Screenshot proof per phase (Browser pane) — user confirms look

## Deferred / Out of Scope
See `Planning Extraction Summary` → Deferred / Excluded (single source; not duplicated here).

## Current State / Handoff Note
- Last completed step: Step 5 — all tasks verified (375/768/1280, dark mode, lint clean); screenshots captured for day view + drawer
- Current in-progress step: None
- Immediate next action: commit; run /document to sync durable docs; next plan = Vercel deployment (consume explore scratch)
- Open blockers / open questions: None
- Last plan sync: 2026-07-24 (hardened via /review-plan — login + patient-form added to audit; chat-dock w-72 overflow fact recorded; watermark task verify-only)

## Review History
- (no reviews yet)

## Review Findings Log
- (no findings logged yet)

## Tasks

- [x] 🟩 Step 1: Mobile shell navigation
  - [x] 🟩 1.1: Create `src/components/mobile-nav.tsx` (client): fixed top bar shown below `md` (logo/clinic mark left, hamburger right, `bg-surface/80 backdrop-blur-xl border-b border-border`, `print:hidden`); slide-over drawer rendering `<SidebarNav />` + theme-toggle row + user block with sign-out (props for profile/branding passed from the server layout); overlay dismiss, Esc close, reduced-motion respected
    - Expected: below 768px a top bar is always visible and the drawer reaches every nav item; ≥768px renders nothing
  - [x] 🟩 1.2: Mount it in `src/app/(app)/layout.tsx`; add mobile top padding to the content column (e.g. `pt-14 md:pt-0`). `LogoWatermark` is already mobile-correct (`md:pl-60` only applies ≥768px) — verify-only, no change expected
    - Expected: dashboard usable at 375px with no layout overlap; desktop pixel-identical
  - Verification: this step verifies inline (Browser pane at 375px + 1280px) — see Validation
- [x] 🟩 Step 2: Calendar mobile fit — `src/app/(app)/calendar/page.tsx`
  - [x] 🟩 2.1: Apply `min-w-[640px]` only when `view === "week"`; day view fills the viewport width (56px gutter + 1 fluid column)
  - [x] 🟩 2.2: Verify header controls (title, Block/New buttons, prev/today/next, day/week toggle) wrap cleanly at 375px; adjust spacing only if broken
  - Expected: day view has no horizontal scroll at 375px; week view scrolls horizontally inside its card only
- [x] 🟩 Step 3: Staff-flow audit + fixes at 375px
  - [x] 🟩 3.1: Audit pass (no fixes yet): login page (`src/app/login/page.tsx`), patients list + `[id]` detail, patient create/edit form (`src/components/patient-form.tsx` via `/patients/new` and `[id]/edit`), `notes/[id]` editor, `invoices` list + `[id]`, `settings` hub + one settings form, `messages`, chat dock — record concrete defects (`file:line`) in this plan under 3.3
  - [x] 🟩 3.2: `[decision]` Booking-dialog mobile presentation
    - Options: keep centered w/ mobile tweaks (`p-4`, full-width inputs) / convert to bottom-sheet below `md`
    - Decide after: 3.1 audit shows the dialog live at 375px
    - Blocks: 3.3 dialog fixes
    - Chosen: keep centered (2026-07-24); rationale: audit measured 343×574px, zero internal overflows — already fits, no structural change needed
  - Audit results (2026-07-24, 375px): PASS — patients list, /patients/new (patient-form), /notes/:id editor, /invoices + /invoices/:id, /settings + /settings/clinic, /messages (stacks below md), chat dock closed (88px bubble), booking dialog (343px wide, 0 internal overflows, grid-cols-2 rows intact). Login code-audited (max-w-sm + px-4 — fine; live view unreachable while authenticated). DEFECTS: (1) /patients/:id — `section.card` overflows to 497px: `dl.grid.grid-cols-2` value cells with unwrappable content (long email) force min-content width; fix = `break-words`/`min-w-0` on the dl cells. (2) chat dock with an open window + member panel extends to left:-13 offscreen at 375px; fix = close member panel when a window opens on mobile and/or responsive window width.
  - [x] 🟩 3.3: Apply fixes from 3.1 + the 3.2 decision (incl. `manage-dialog.tsx` alongside `booking-dialog.tsx`). Known code fact for `chat-dock.tsx`: chat windows are fixed `w-72` and multiple render side-by-side in a `fixed bottom-0 right-0` row — multiple open windows WILL overflow 375px; cap open windows or stack on mobile
  - Expected: every audited flow completable at 375px without horizontal body scroll
- [x] 🟩 Step 4: Public pages audit + fixes at 375px — `/book/[slug]` flow (`booking-flow.tsx`, `slot-picker.tsx`), `/book/manage/[token]`, `/measure/[token]` (`measure-form.tsx`)
  - Expected: a patient can book, manage, and fill an outcome form comfortably on a phone
- [x] 🟩 Step 5: Cross-width verification pass (375 / 768 / 1280, light + dark) per Validation / Verification; screenshot proof; fix stragglers
  - Expected: all success criteria met; desktop unchanged

## Retained Follow-Up Items
Completion review 2026-07-24 (user-confirmed category classifications).

### Deferred — Actionable Later
- Vercel deployment — Status: Carried Forward. All context unchanged from `Planning Extraction Summary` (new prod Supabase project; cron GET handler; Node runtime; APP_URL; see explore scratch). Risk if deferred: blocked-work: app remains local-only. Revisit by: now (this plan is complete — the stated trigger has fired). Reconciliation notes: [2026-07-24 reconciliation] Still valid — next priority.
- Email/AI end-to-end verification — Status: Carried Forward. Risk if deferred: ux-degradation: reminders/tidying untested. Revisit by: deployment plan kickoff. Reconciliation notes: [2026-07-24 reconciliation] Still valid.
- Test safety net — Status: Carried Forward. Risk if deferred: correctness: no regression protection. Revisit by: after deployment ships. Reconciliation notes: [2026-07-24 reconciliation] Still valid.
- Clinic self-serve onboarding wizard — Status: Carried Forward. Risk if deferred: blocked-work: cannot sell to other clinics without it. Revisit by: when a second clinic is ready to trial. Reconciliation notes: [2026-07-24 reconciliation] Still valid — SaaS vision constraint recorded in Key Design Decisions.

### Excluded — Revisit Only If Needed
- Custom domain + DNS + Resend domain verification — Status: Carried Forward. When to revisit: deployment plan.
- SMS reminders, per-appointment-type comms, staging environment — Status: Carried Forward. When to revisit: post-deployment feature planning.
- Bottom-tab navigation — Status: Carried Forward. When to revisit: only if real mobile usage shows the drawer is too slow for daily front-desk use.

### Accepted Assumptions — Revalidate Later
- `md` (768px) cutover — Status: Superseded (validated). Held at every audited surface; now an established convention (recorded in docs/design-system.md territory).
- Purely client/UI work — Status: Superseded (validated). No server/schema change was needed anywhere in scope.

## Follow-Up Continuation Notes
- Next follow-up after this plan: the Vercel deployment plan (consume the Deferred item + `.cursor/plans/explore-deploy-vercel-mobile-nav.md` Key Findings)
- Remain out of scope: onboarding wizard, SMS/comms features, tests (each has its own Deferred entry)
- Design decisions that persist: SaaS/multi-clinic constraint, design-system-only styling, `md` cutover
- Do not rediscover: cron GET/Node-runtime/`APP_URL` findings (explore scratch); `resend.ts` `child_process` import; email_log idempotency

---
*Plan saved to: .cursor/plans/plan-mobile-experience.md*
*To resume in a new session: open a fresh Agent (Ctrl+I), run /start-session, then run /load-plan*
