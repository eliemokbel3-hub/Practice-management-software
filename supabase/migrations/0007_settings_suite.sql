-- Full settings suite: managed lists, template libraries, custom fields and
-- message templates — everything clinic-configurable, nothing hard-coded.
-- Every tenant table carries clinic_id and the uniform "tenant" RLS policy.

-- ---------------------------------------------------------------------------
-- Simple managed lists
-- ---------------------------------------------------------------------------
create table block_types (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references clinics (id) on delete cascade,
  name       text not null,
  color      text not null default '#94a3b8',
  is_active  boolean not null default true,
  sort_order int not null default 0
);

create table recall_types (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references clinics (id) on delete cascade,
  name          text not null,
  interval_days int not null default 182,
  message       text,
  is_active     boolean not null default true,
  sort_order    int not null default 0
);

create table referral_sources (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references clinics (id) on delete cascade,
  name       text not null,
  is_active  boolean not null default true,
  sort_order int not null default 0
);

create table concession_types (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references clinics (id) on delete cascade,
  name       text not null,
  is_active  boolean not null default true,
  sort_order int not null default 0
);

create table tax_rates (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references clinics (id) on delete cascade,
  name       text not null,
  rate       numeric not null default 0,   -- decimal, e.g. 0.10 for 10%
  is_default boolean not null default false,
  is_active  boolean not null default true,
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- Patient configuration
-- ---------------------------------------------------------------------------
create table custom_patient_fields (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references clinics (id) on delete cascade,
  label      text not null,
  field_type text not null default 'text',  -- 'text' | 'paragraph' | 'date' | 'select' | 'checkbox'
  options    jsonb not null default '[]',   -- choices for 'select'
  sort_order int not null default 0,
  is_active  boolean not null default true
);

-- Per-patient custom field values: { fieldId: value }.
alter table patients add column custom jsonb not null default '{}';

-- Reusable questionnaire structure (same shape as note_templates.sections),
-- for intake / consent forms.
create table patient_form_templates (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references clinics (id) on delete cascade,
  name       text not null,
  description text,
  sections   jsonb not null default '[]',
  is_active  boolean not null default true
);

create table body_chart_templates (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references clinics (id) on delete cascade,
  name       text not null,
  region     text not null default 'full_body',  -- full_body | spine | upper | lower | head_neck
  is_active  boolean not null default true,
  sort_order int not null default 0
);

create table letter_templates (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references clinics (id) on delete cascade,
  name       text not null,
  body       text not null default '',   -- supports {placeholders}
  is_active  boolean not null default true
);

-- ---------------------------------------------------------------------------
-- Communication templates (email now; SMS channel reserved for later)
-- ---------------------------------------------------------------------------
create table message_templates (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references clinics (id) on delete cascade,
  kind       text not null,   -- confirmation | reminder | cancellation | reschedule | followup
  channel    text not null default 'email',
  subject    text not null default '',
  body       text not null default '',   -- supports {placeholders}
  is_active  boolean not null default true,
  unique (clinic_id, kind, channel)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table block_types enable row level security;
alter table recall_types enable row level security;
alter table referral_sources enable row level security;
alter table concession_types enable row level security;
alter table tax_rates enable row level security;
alter table custom_patient_fields enable row level security;
alter table patient_form_templates enable row level security;
alter table body_chart_templates enable row level security;
alter table letter_templates enable row level security;
alter table message_templates enable row level security;

create policy "tenant" on block_types
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on recall_types
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on referral_sources
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on concession_types
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on tax_rates
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on custom_patient_fields
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on patient_form_templates
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on body_chart_templates
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on letter_templates
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on message_templates
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());

-- ---------------------------------------------------------------------------
-- Seed sensible starting data for the existing clinic(s)
-- ---------------------------------------------------------------------------
do $$
declare c record;
begin
  for c in select id from clinics loop
    insert into block_types (clinic_id, name, color, sort_order) values
      (c.id, 'Lunch', '#f59e0b', 1),
      (c.id, 'Admin', '#94a3b8', 2),
      (c.id, 'Meeting', '#818cf8', 3),
      (c.id, 'Leave', '#f87171', 4);

    insert into recall_types (clinic_id, name, interval_days, message, sort_order) values
      (c.id, '6-month review', 182, 'Time for your check-up — book online any time.', 1),
      (c.id, 'Annual review', 365, 'It has been a year since your last visit — we''d love to see you.', 2);

    insert into referral_sources (clinic_id, name, sort_order) values
      (c.id, 'Word of mouth', 1),
      (c.id, 'Google search', 2),
      (c.id, 'GP referral', 3),
      (c.id, 'Returning patient', 4),
      (c.id, 'Social media', 5),
      (c.id, 'Walk-in', 6);

    insert into concession_types (clinic_id, name, sort_order) values
      (c.id, 'Pensioner', 1),
      (c.id, 'Health Care Card', 2),
      (c.id, 'Student', 3),
      (c.id, 'DVA', 4);

    insert into tax_rates (clinic_id, name, rate, is_default, sort_order) values
      (c.id, 'GST-free', 0, true, 1),
      (c.id, 'GST 10%', 0.10, false, 2);

    insert into body_chart_templates (clinic_id, name, region, sort_order) values
      (c.id, 'Full body', 'full_body', 1),
      (c.id, 'Spine', 'spine', 2),
      (c.id, 'Head & neck', 'head_neck', 3);

    insert into message_templates (clinic_id, kind, channel, subject, body) values
      (c.id, 'confirmation', 'email',
       'Appointment confirmed — {clinic_name}',
       'Hi {patient_first_name},'||chr(10)||chr(10)||'Your appointment is confirmed:'||chr(10)||'{appointment_details}'||chr(10)||'{manage_link}'||chr(10)||chr(10)||'See you then!'),
      (c.id, 'reminder', 'email',
       'Appointment reminder — {clinic_name}',
       'Hi {patient_first_name},'||chr(10)||chr(10)||'A friendly reminder about your upcoming appointment:'||chr(10)||'{appointment_details}'||chr(10)||'{manage_link}'),
      (c.id, 'cancellation', 'email',
       'Appointment cancelled — {clinic_name}',
       'Hi {patient_first_name},'||chr(10)||chr(10)||'This confirms your appointment has been cancelled:'||chr(10)||'{appointment_details}'||chr(10)||chr(10)||'If this wasn''t you, or you''d like to rebook, please get in touch with the clinic.'),
      (c.id, 'followup', 'email',
       'Checking in — {clinic_name}',
       'Hi {patient_first_name},'||chr(10)||chr(10)||'Just checking in after your recent visit. If anything has come up or you''d like to book again, simply reply to this email or book online any time.'||chr(10)||chr(10)||'Take care.');
  end loop;
end $$;
