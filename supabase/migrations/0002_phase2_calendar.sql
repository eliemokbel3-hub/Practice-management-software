-- Phase 2: calendar. Appointment-type extras learned from the Cliniko survey,
-- plus TuneUp's real appointment types and default working hours.

alter table appointment_types
  add column category text,          -- free text, e.g. "Osteopathy", "Physiotherapy"
  add column max_patients int not null default 1;  -- >1 enables group bookings later

-- Seed TuneUp's appointment types (mirrors their Cliniko config) and
-- default working hours (Mon-Fri 9:00-17:00 — editable in Settings).
do $$
declare
  v_clinic uuid;
  v_elie uuid;
  v_type uuid;
  r record;
begin
  select id into v_clinic from clinics where name = 'TuneUp Osteopathy';
  select id into v_elie from profiles where clinic_id = v_clinic and role = 'owner' limit 1;
  if v_clinic is null or v_elie is null then
    raise exception 'Clinic or owner profile not found — run the Phase 1 seed first.';
  end if;
  if exists (select 1 from appointment_types where clinic_id = v_clinic) then
    raise exception 'Appointment types already exist — nothing to do.';
  end if;

  for r in
    select * from (values
      ('Initial Appointment',            'Osteopathy', 45, 7000,  '#FDCA86', false, 1),
      ('Standard Appointment',           'Osteopathy', 30, 7000,  '#7edcd2', true,  2),
      ('Long Consultation (60 Mins)',    'Osteopathy', 60, 11000, '#9292ff', true,  3),
      ('Medicare Consult',               'Osteopathy', 30, 6340,  '#bcffb8', false, 4),
      ('TAC Initial Consultation O600',  'Osteopathy', 45, 9000,  '#ff8a8a', false, 5),
      ('TAC Standard Consultation',      'Osteopathy', 45, 8500,  '#ff8a8a', false, 6),
      ('Workcover Return Appointment',   'Osteopathy', 30, 8177,  '#feffb8', false, 7),
      ('Broncos Basketball',             'Osteopathy', 30, 5000,  '#a8f0e4', false, 8)
    ) as t(name, category, duration_minutes, price_cents, color, bookable_online, sort_order)
  loop
    insert into appointment_types
      (clinic_id, name, category, duration_minutes, price_cents, color, bookable_online, sort_order)
    values
      (v_clinic, r.name, r.category, r.duration_minutes, r.price_cents, r.color, r.bookable_online, r.sort_order)
    returning id into v_type;
    insert into practitioner_appointment_types (practitioner_id, appointment_type_id, clinic_id)
    values (v_elie, v_type, v_clinic);
  end loop;

  -- Default schedule: Monday(1) to Friday(5), 9:00-17:00.
  insert into working_hours (clinic_id, practitioner_id, weekday, start_time, end_time)
  select v_clinic, v_elie, d, time '09:00', time '17:00' from generate_series(1, 5) as d;

  raise notice 'Done: 8 appointment types and Mon-Fri working hours created.';
end $$;
