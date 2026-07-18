-- Phase 4: invoicing & payments.
-- Design rule: nothing billing-related is hard-coded. Payment types, billable
-- items, GST rate, and clinic details are all per-clinic configuration; the
-- seeds below just load TuneUp's starting data.

-- Payment types become clinic-defined rows (replacing the fixed enum).
create table payment_types (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references clinics (id) on delete cascade,
  name       text not null,
  is_active  boolean not null default true,
  sort_order int not null default 0
);
alter table payment_types enable row level security;
create policy "tenant" on payment_types
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());

-- payments table is empty; swap the enum column for the reference.
alter table payments drop column method;
drop type payment_method;
alter table payments
  add column payment_type_id uuid references payment_types (id) on delete set null;

-- Each appointment type can name the billable item it invoices by default.
alter table appointment_types
  add column default_service_item_id uuid references service_items (id) on delete set null;

do $$
declare
  v_clinic uuid;
  v_item uuid;
  r record;
begin
  select id into v_clinic from clinics where name = 'TuneUp Osteopathy';
  if v_clinic is null then
    raise exception 'Clinic not found — run earlier seeds first.';
  end if;
  if exists (select 1 from service_items where clinic_id = v_clinic) then
    raise exception 'Billing data already exists — nothing to do.';
  end if;

  -- Clinic details shown on invoices/receipts (editable in Settings).
  update clinics set
    abn = '48 893 034 621',
    address = '52 Westmere Crescent',
    suburb = 'Coolaroo',
    state = 'VIC',
    postcode = '3048',
    settings = settings || '{"gst_rate": 0.10, "invoice_title": "Tax Invoice"}'::jsonb
  where id = v_clinic;

  -- Payment types (from TuneUp's Cliniko).
  insert into payment_types (clinic_id, name, sort_order) values
    (v_clinic, 'HICAPS', 1),
    (v_clinic, 'EFTPOS', 2),
    (v_clinic, 'Cash', 3),
    (v_clinic, 'Medicare', 4),
    (v_clinic, 'Other', 5);

  -- Billable items (codes + prices from TuneUp's Cliniko).
  for r in
    select * from (values
      ('1804',  'Initial consultation and treatment',                7000,  false),
      ('1802',  'Standard consultation and treatment',               7000,  false),
      ('1802',  'Long consultation and treatment',                  11000,  false),
      ('10966', 'Medicare Consult',                                  6340,  false),
      ('O600',  'Initial Consultation: New patient, history & examination', 9000, false),
      ('O602',  'Standard Consultation',                             8500,  false),
      ('OS102', 'Standard Consultation (AND >= 20 mins)',            8177,  false),
      ('1802',  'Broncos',                                           5000,  false),
      ('MX113', 'Copy of Clinical Notes',                             100,  true),
      ('INS111','INS111 (Osteopathy)',                               8618,  false),
      ('INS101','Questionnaire',                                    13357,  true),
      (null,    'TNL Discount',                                     -1000,  false)
    ) as t(code, name, price_cents, gst_applies)
  loop
    insert into service_items (clinic_id, code, name, price_cents, gst_applies)
    values (v_clinic, coalesce(r.code, ''), r.name, r.price_cents, r.gst_applies);
  end loop;

  -- Link each appointment type to its default billable item (as in Cliniko).
  for r in
    select * from (values
      ('Initial Appointment',           'Initial consultation and treatment'),
      ('Standard Appointment',          'Standard consultation and treatment'),
      ('Long Consultation (60 Mins)',   'Long consultation and treatment'),
      ('Medicare Consult',              'Medicare Consult'),
      ('TAC Initial Consultation O600', 'Initial Consultation: New patient, history & examination'),
      ('TAC Standard Consultation',     'Standard Consultation'),
      ('Workcover Return Appointment',  'Standard Consultation (AND >= 20 mins)'),
      ('Broncos Basketball',            'Broncos')
    ) as t(type_name, item_name)
  loop
    select id into v_item from service_items
      where clinic_id = v_clinic and name = r.item_name limit 1;
    update appointment_types
      set default_service_item_id = v_item
      where clinic_id = v_clinic and name = r.type_name;
  end loop;

  raise notice 'Done: payment types, billable items, defaults and clinic details seeded.';
end $$;
