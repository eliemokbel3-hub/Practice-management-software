-- Per-clinic branding: an uploaded logo and a brand colour that drives the
-- app's theme. Both are optional; null falls back to the default PracticeHub
-- look. The logo is stored as a re-encoded raster data URL (small), so no
-- object storage is needed and there's no way for an uploaded SVG to smuggle
-- in script.
alter table clinics add column logo text;
alter table clinics add column brand_color text;
