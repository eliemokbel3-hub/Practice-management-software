-- Phase 5: online bookings + email reminders.
-- Booking behaviour (min notice, cancellation policy, reminder timing, ...)
-- lives in clinics.settings jsonb so every clinic can tune it in Settings.

-- Public booking page URL: /book/<slug>. Unique across all clinics.
alter table clinics add column slug text unique;

-- Secret per-appointment token used in emailed cancel/reschedule links.
-- Knowing the token is what authorises the patient to manage that booking.
alter table appointments
  add column manage_token uuid not null unique default gen_random_uuid();

-- Every email the app sends (or skips/fails to send) is recorded here, so the
-- clinic can see what a patient was told and reminders are never sent twice.
create type email_status as enum ('sent', 'failed', 'skipped');

create table email_log (
  id             uuid primary key default gen_random_uuid(),
  clinic_id      uuid not null references clinics (id) on delete cascade,
  patient_id     uuid references patients (id) on delete set null,
  appointment_id uuid references appointments (id) on delete cascade,
  email_type     text not null,   -- 'confirmation' | 'reminder' | 'cancellation' | 'reschedule' | 'clinic_notification'
  to_email       text not null,
  subject        text not null,
  status         email_status not null,
  error          text,
  created_at     timestamptz not null default now()
);
create index email_log_appointment_idx on email_log (appointment_id, email_type);

-- At most one successfully sent reminder per appointment.
create unique index email_log_one_reminder
  on email_log (appointment_id)
  where email_type = 'reminder' and status = 'sent';

alter table email_log enable row level security;
-- Clinic staff can read their own email history; rows are written by the app
-- server (service role), which bypasses RLS — no anon access anywhere.
create policy "tenant read" on email_log
  for select using (clinic_id = auth_clinic_id());

-- Give the existing clinic a slug derived from its name.
update clinics
set slug = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))
where slug is null;
