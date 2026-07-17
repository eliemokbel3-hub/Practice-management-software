-- PracticeHub — initial multi-tenant schema.
-- Every tenant table carries clinic_id and is protected by row-level security,
-- so one clinic can never read another clinic's rows even if application code
-- has a bug. Designed for Supabase (auth.users provided by GoTrue).

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role as enum ('owner', 'practitioner', 'reception');
create type appointment_status as enum
  ('booked', 'arrived', 'completed', 'cancelled', 'did_not_arrive');
create type note_status as enum ('draft', 'final');
create type invoice_status as enum ('draft', 'issued', 'paid', 'void');
create type payment_method as enum ('cash', 'card', 'eft', 'other');

-- ---------------------------------------------------------------------------
-- Core tenancy
-- ---------------------------------------------------------------------------
create table clinics (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  timezone    text not null default 'Australia/Melbourne',
  phone       text,
  email       text,
  abn         text,
  address     text,
  suburb      text,
  state       text,
  postcode    text,
  settings    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

-- One row per login; links a Supabase auth user to a clinic and role.
create table profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  clinic_id    uuid not null references clinics (id) on delete cascade,
  role         user_role not null default 'practitioner',
  first_name   text not null,
  last_name    text not null,
  title        text,            -- e.g. "Osteopath"
  email        text not null,
  phone        text,
  ahpra_number text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- The clinic of the currently signed-in user. security definer so it can read
-- profiles regardless of RLS; used inside every tenant policy below.
create function auth_clinic_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select clinic_id from profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Patients
-- ---------------------------------------------------------------------------
create table patients (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references clinics (id) on delete cascade,
  first_name    text not null,
  last_name     text not null,
  preferred_name text,
  date_of_birth date,
  sex           text,
  email         text,
  phone         text,
  address_line1 text,
  suburb        text,
  state         text,
  postcode      text,
  occupation    text,
  emergency_contact_name         text,
  emergency_contact_phone        text,
  emergency_contact_relationship text,
  medical_history text,
  alerts        text,
  referral_source text,
  health_fund_name          text,
  health_fund_member_number text,
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index patients_clinic_name_idx on patients (clinic_id, last_name, first_name);

-- ---------------------------------------------------------------------------
-- Scheduling
-- ---------------------------------------------------------------------------
create table appointment_types (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references clinics (id) on delete cascade,
  name          text not null,
  description   text,
  duration_minutes      int not null,
  price_cents   int not null default 0,
  color         text not null default '#0d9488',
  buffer_before_minutes int not null default 0,
  buffer_after_minutes  int not null default 0,
  bookable_online boolean not null default true,
  is_active     boolean not null default true,
  sort_order    int not null default 0
);

-- Which practitioners offer which appointment types.
create table practitioner_appointment_types (
  practitioner_id     uuid not null references profiles (id) on delete cascade,
  appointment_type_id uuid not null references appointment_types (id) on delete cascade,
  clinic_id           uuid not null references clinics (id) on delete cascade,
  primary key (practitioner_id, appointment_type_id)
);

create table appointments (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references clinics (id) on delete cascade,
  patient_id      uuid not null references patients (id) on delete restrict,
  practitioner_id uuid not null references profiles (id) on delete restrict,
  appointment_type_id uuid references appointment_types (id) on delete set null,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  status          appointment_status not null default 'booked',
  cancellation_reason text,
  admin_notes     text,
  recurrence_group uuid,        -- shared id linking a recurring series
  booked_online   boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index appointments_clinic_time_idx on appointments (clinic_id, starts_at);
create index appointments_patient_idx on appointments (patient_id);

-- Regular weekly working hours per practitioner (0 = Sunday).
create table working_hours (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references clinics (id) on delete cascade,
  practitioner_id uuid not null references profiles (id) on delete cascade,
  weekday         int not null check (weekday between 0 and 6),
  start_time      time not null,
  end_time        time not null,
  check (end_time > start_time)
);

-- One-off unavailability: lunch, admin, leave.
create table blocked_times (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references clinics (id) on delete cascade,
  practitioner_id uuid not null references profiles (id) on delete cascade,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  reason          text,
  check (ends_at > starts_at)
);

-- ---------------------------------------------------------------------------
-- Clinical notes
-- ---------------------------------------------------------------------------
create table note_templates (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references clinics (id) on delete cascade,
  name       text not null,
  -- Ordered sections, e.g. [{"key":"subjective","label":"Subjective","type":"textarea"}]
  sections   jsonb not null default '[]',
  is_default boolean not null default false,
  is_active  boolean not null default true
);

create table clinical_notes (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references clinics (id) on delete cascade,
  patient_id      uuid not null references patients (id) on delete restrict,
  practitioner_id uuid not null references profiles (id) on delete restrict,
  appointment_id  uuid references appointments (id) on delete set null,
  template_id     uuid references note_templates (id) on delete set null,
  content         jsonb not null default '{}',   -- section key -> text
  status          note_status not null default 'draft',
  finalised_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index clinical_notes_patient_idx on clinical_notes (patient_id, created_at desc);

-- Full copy of a finalised note's content each time it is amended —
-- clinical records must keep their edit history.
create table clinical_note_revisions (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references clinics (id) on delete cascade,
  note_id    uuid not null references clinical_notes (id) on delete cascade,
  content    jsonb not null,
  edited_by  uuid not null references profiles (id),
  edited_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Billing
-- ---------------------------------------------------------------------------
-- Billable service items with the codes health funds expect on receipts.
create table service_items (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references clinics (id) on delete cascade,
  code        text not null,      -- e.g. osteo item code "1802"
  name        text not null,
  price_cents int not null default 0,
  gst_applies boolean not null default false,  -- most osteo services are GST-free
  is_active   boolean not null default true
);

create table invoices (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references clinics (id) on delete cascade,
  patient_id      uuid not null references patients (id) on delete restrict,
  practitioner_id uuid references profiles (id) on delete set null,
  invoice_number  bigint not null,
  status          invoice_status not null default 'draft',
  issued_date     date,
  subtotal_cents  int not null default 0,
  gst_cents       int not null default 0,
  total_cents     int not null default 0,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (clinic_id, invoice_number)
);

create table invoice_lines (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references clinics (id) on delete cascade,
  invoice_id      uuid not null references invoices (id) on delete cascade,
  service_item_id uuid references service_items (id) on delete set null,
  appointment_id  uuid references appointments (id) on delete set null,
  description     text not null,
  code            text,
  quantity        int not null default 1,
  unit_price_cents int not null default 0,
  gst_cents       int not null default 0
);

create table payments (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references clinics (id) on delete cascade,
  invoice_id  uuid not null references invoices (id) on delete cascade,
  amount_cents int not null,
  method      payment_method not null,
  paid_at     timestamptz not null default now(),
  reference   text
);

-- ---------------------------------------------------------------------------
-- Clinic messaging
-- ---------------------------------------------------------------------------
create table messages (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references clinics (id) on delete cascade,
  sender_id    uuid not null references profiles (id) on delete cascade,
  recipient_id uuid not null references profiles (id) on delete cascade,
  body         text not null,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index messages_recipient_idx on messages (recipient_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Outcome measures
-- ---------------------------------------------------------------------------
-- Global questionnaire library (ODI, NDI, PSFS, LEFS, ...): shared across all
-- clinics, read-only to them. definition holds questions + scoring rules.
create table outcome_measures (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,   -- e.g. "odi"
  name        text not null,
  description text,
  definition  jsonb not null,
  is_active   boolean not null default true
);

-- A questionnaire sent to a patient. token is the secret in the emailed link;
-- the patient-facing form is served by the app server (service role), so no
-- anon RLS access is needed.
create table outcome_measure_requests (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references clinics (id) on delete cascade,
  patient_id  uuid not null references patients (id) on delete cascade,
  measure_id  uuid not null references outcome_measures (id),
  requested_by uuid references profiles (id) on delete set null,
  token       uuid not null unique default gen_random_uuid(),
  sent_at     timestamptz,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

create table outcome_measure_responses (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references clinics (id) on delete cascade,
  request_id  uuid not null unique references outcome_measure_requests (id) on delete cascade,
  answers     jsonb not null,
  score       numeric,
  subscores   jsonb,
  completed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger patients_updated_at before update on patients
  for each row execute function set_updated_at();
create trigger appointments_updated_at before update on appointments
  for each row execute function set_updated_at();
create trigger clinical_notes_updated_at before update on clinical_notes
  for each row execute function set_updated_at();
create trigger invoices_updated_at before update on invoices
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table clinics enable row level security;
alter table profiles enable row level security;
alter table patients enable row level security;
alter table appointment_types enable row level security;
alter table practitioner_appointment_types enable row level security;
alter table appointments enable row level security;
alter table working_hours enable row level security;
alter table blocked_times enable row level security;
alter table note_templates enable row level security;
alter table clinical_notes enable row level security;
alter table clinical_note_revisions enable row level security;
alter table service_items enable row level security;
alter table invoices enable row level security;
alter table invoice_lines enable row level security;
alter table payments enable row level security;
alter table messages enable row level security;
alter table outcome_measures enable row level security;
alter table outcome_measure_requests enable row level security;
alter table outcome_measure_responses enable row level security;

create policy "own clinic" on clinics
  for all using (id = auth_clinic_id());

create policy "own clinic members" on profiles
  for select using (clinic_id = auth_clinic_id());
create policy "own profile update" on profiles
  for update using (id = auth.uid());

-- Uniform tenant policy: full access to rows of your own clinic.
create policy "tenant" on patients
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on appointment_types
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on practitioner_appointment_types
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on appointments
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on working_hours
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on blocked_times
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on note_templates
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on clinical_notes
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on clinical_note_revisions
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on service_items
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on invoices
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on invoice_lines
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on payments
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on messages
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on outcome_measure_requests
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
create policy "tenant" on outcome_measure_responses
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());

-- Global questionnaire library: readable by any signed-in user, managed
-- only via migrations / service role.
create policy "library read" on outcome_measures
  for select using (auth.role() = 'authenticated');
