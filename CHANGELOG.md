# Changelog

All notable changes to this project will be documented here.

## [Unreleased]

### Added
- Cursor/Claude Code/Codex agent workflow tooling (`.cursor/`, `.claude/skills/`, `.agents/`, `.codex/`) via bootstrap v30.
- Project briefing filled out in `AGENTS.md`; `.env.example` generated from discovered environment variables.

### Changed
- Premium UI facelift: design-token and component-class system (`.card`, `.btn-primary`/`.btn-secondary`, `.input-base`, gradient/glow/shadow tokens that follow clinic branding), applied across every page — restyled login, app shell, dashboard, patients, invoices, and settings.

### Fixed
- Double-encoded seed text (mojibake, e.g. "â€”" for em-dashes) in patient alerts and other seeded rows — repaired via `scripts/fix-mojibake.mjs`; seed file now pins `client_encoding` to UTF-8 so Windows psql can't re-corrupt it.

### Removed
-

### Security
-
