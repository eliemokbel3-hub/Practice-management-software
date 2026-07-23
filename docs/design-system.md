# PracticeHub design system

Established in the 2026-07-24 "premium clinical SaaS" facelift. All literal values
live in code — `src/app/globals.css` is the single source of truth for tokens and
component classes; this doc records the conventions and where each one is anchored.

## Tokens (`src/app/globals.css`)

- **Semantic color tokens** (`--background`, `--surface`, `--border`, `--foreground`,
  `--muted`, `--faint`, `--primary` family, `--danger`/`--warning` softs) defined on
  `:root` (light) and `.dark`, mapped into Tailwind via `@theme inline`. Use the
  Tailwind names (`bg-surface`, `text-faint`, `border-border`) — never raw hex.
- **Clinic branding cascade**: `src/lib/branding.ts` (`brandThemeCss`) overrides only
  the `--primary` family per clinic. Every accent effect must therefore derive from
  `var(--primary)` — the gradient/glow tokens (`--gradient-primary`, `--glow-primary`,
  `--tint-primary`) do this with `color-mix(in oklab, var(--primary) …)`. Never
  hard-code a teal.
- **Elevation**: layered ink-tinted shadow scale `--shadow-xs/sm/md/lg`, exposed as
  Tailwind `shadow-xs`…`shadow-lg`. Cards sit at `sm`, hover to `md`, dialogs/login at `lg`.
- **Ambient wash**: `body::before` paints two radial `--tint-primary` gradients —
  pages never sit on flat gray. Don't add per-page backgrounds.

## Component classes (`@layer components` in globals.css)

- `.card` — standard surface (1rem radius, border, `--shadow-sm`). Add `.card-hover`
  for interactive cards (lift + shadow-md). Canonical: settings tiles in
  `src/app/(app)/settings/page.tsx`, dashboard `Panel` in `src/app/(app)/page.tsx`.
- `.btn-primary` — gradient background, glow, press-down scale; disabled state built in.
  Size variants by appending utilities (`px-5 py-2.5`) — Tailwind utilities out-cascade
  the components layer.
- `.btn-secondary` — bordered surface button.
- `.input-base` — inputs/textareas/selects: soft shadow, branded focus halo
  (`box-shadow` ring). Canonical: login form `src/app/login/page.tsx`.
- `.section-label` — uppercase tracked panel/section headings.

## Type scale

- Page `h1`: `text-[26px] font-semibold leading-tight tracking-tight` (dashboard
  greeting is 28px). Applied to all pages in the facelift — keep new pages consistent.
- Body/UI text stays `text-sm`; labels `text-xs`/`section-label`.
- Hero numbers (stat cards): `text-[28px] font-semibold tracking-tight`; one accent
  figure per view may use gradient text (`bg-clip-text` + `--gradient-primary`) —
  canonical: `src/app/(app)/invoices/page.tsx`.

## Motion

- Entrance: `.animate-fade-up` on the page header, `.animate-fade-up-delayed` on the
  first content block. Both no-op under `prefers-reduced-motion`.
- Hovers: color/shadow/translate transitions ~150–200ms; nav items nudge
  (`hover:translate-x-0.5`), chevrons slide (`group-hover:translate-x-0.5`).

## Patterns

- **App shell**: frosted sidebar (`bg-surface/80 backdrop-blur-xl`), gradient logo chip,
  active nav = `bg-primary-soft` pill + 0.5px primary indicator bar
  (`src/components/sidebar-nav.tsx`, `src/app/(app)/layout.tsx`).
- **Tables**: wrap in `.card`; `thead` row gets `bg-background/60` tint + uppercase
  faint labels; entity rows lead with an initials avatar (`bg-primary-soft` circle).
  Canonical: `src/app/(app)/patients/page.tsx`.
- **List pages**: h1 + record-count subtitle, `.btn-primary` action top-right,
  `.input-base` search with inset icon.
- **Filter pills**: bordered `bg-surface` group, active pill `bg-primary-soft` +
  `shadow-xs` (`src/app/(app)/invoices/page.tsx`).
