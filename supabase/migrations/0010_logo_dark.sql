-- Optional second logo for dark backgrounds. Clinics can supply a light and a
-- dark version; the app shows whichever suits the current theme. Neither is
-- required — a single logo is used everywhere when only one is set.
alter table clinics add column logo_dark text;
