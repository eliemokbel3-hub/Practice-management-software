<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: PracticeHub

## What This App Does
PracticeHub is an allied-health practice-management app (a Cliniko-style system) for clinics
such as osteopathy, physiotherapy, and psychology. It is deliberately **profession-generic**:
everything clinical (appointment types, note/form templates, billable items, taxes, payment
types, recall/concession/referral types, custom fields, terminology) is clinic-level
configuration rather than hard-coded. Used by practitioners, receptionists, and clinic owners.

## Tech Stack
| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 16 (App Router) + React 19 | `src/app/`, route groups; TypeScript |
| Styling | Tailwind CSS v4 | `next-themes` for light/dark |
| Backend | Next.js server (route handlers + server components) | Supabase server/admin clients |
| Database | Supabase (Postgres) | `supabase/migrations/`, RLS-scoped; `@supabase/ssr` |
| Auth | Supabase Auth | enforced in `src/middleware.ts` |
| Email | Resend | `src/lib/email/` (reminders, templates) |
| AI | Anthropic SDK | `src/lib/ai/tidy-note.ts` (clinical-note tidying) |
| Hosting | Not deployed yet (local dev) | source=user-confirmed:2026-07-22 |

## Environment Variables
See `.env.example` for the full list. Secrets live only in local `.env` (never committed).

| Variable | Purpose |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL (public) |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon/public key |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service-role key (server-only, secret) |
| ANTHROPIC_API_KEY | Anthropic API key for note tidying |
| RESEND_API_KEY | Resend API key for transactional email |
| RESEND_FROM_EMAIL | From address for outbound email |
| APP_URL / NEXT_PUBLIC_APP_URL | App base URL (server / client) |
| CRON_SECRET | Shared secret authenticating the reminders cron endpoint |

## Database Notes
Schema lives in `supabase/migrations/` (0001–0011). Key tables include: `clinics`, `profiles`,
`patients`, `appointments`, `appointment_types`, `working_hours`, `blocked_times`/`block_types`,
`clinical_notes` (+ `clinical_note_revisions`), `note_templates`/`body_chart_templates`,
`patient_form_templates`, `outcome_measures` (+ `_requests`/`_responses`), `invoices`
(+ `invoice_lines`), `payments`/`payment_types`, `service_items`, `tax_rates`,
`concession_types`, `recall_types`, `referral_sources`, `custom_patient_fields`,
`message_templates`/`messages`/`board_posts`, `letter_templates`, and `email_log`.
Data-access helpers are in `src/lib/data/`.

## Local Run Steps
**Prerequisites:** Node 20+, npm; a Supabase project (URL + keys).

1. Clone the repo
2. Copy `.env.example` to `.env` (or `.env.local`) and fill in real values
3. Install dependencies: `npm install`
4. Run the dev server: `npm run dev`
5. Verify: open `http://localhost:3000` — unauthenticated visitors are redirected to sign-in; after auth the app shell (sidebar nav) renders.

Other commands: `npm run build`, `npm start`, `npm run lint`. Database migrations are managed
with the Supabase CLI (`supabase` dev dependency) against `supabase/migrations/`.

Machine-specific run notes (local absolute paths, personal DB endpoints, machine-local ports)
belong in a gitignored `AGENTS.local.md` — never secrets.

## Current Status
Substantially built. Core phases are in place: patients, calendar/appointments, clinical notes
with templates and revisions, billing/invoices, online bookings, a message board, outcome
measures, and a large clinic-settings suite (appointment types, billable items, taxes, payment/
recall/concession types, referral sources, custom fields, note/form/letter/message templates,
users, branding). Recent work: auto-branding theme generation from logo upload (with background
removal + trim), logo watermark, optional dark-mode logo, clinical-note archiving, and
owner-driven team-member password reset.

## Last Session
- Date: 2026-07-22
- Worked on: Installed the Cursor/Claude Code/Codex workflow bootstrap (v30) and reconciled project documentation.
- Next priority: —

## Known Issues / Next Tasks
- [ ]

## Subsystem Documentation
- If working on appointment types, billing, note/form templates, comms, or clinic settings, read `docs/cliniko-customisation-map.md` (Cliniko feature survey driving the profession-generic data model).

## Documentation Status
- Structure version: v22
- Last reviewed: 2026-07-22
