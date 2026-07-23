-- One-time setup: create the TuneUp Osteopathy clinic, link Elie's login to
-- it as owner, and add fictional sample patients for testing.
-- Run AFTER creating the auth user (Authentication → Add user) in Supabase.

-- This file is UTF-8. Without this, psql on Windows defaults client_encoding
-- to the console codepage (WIN1252) and double-encodes em-dashes etc.
set client_encoding to 'utf8';

do $$
declare
  v_user uuid;
  v_clinic uuid;
begin
  select id into v_user from auth.users where email = 'eliemokbel3@gmail.com';
  if v_user is null then
    raise exception 'No login found for eliemokbel3@gmail.com — create the user first (Authentication → Add user).';
  end if;
  if exists (select 1 from profiles where id = v_user) then
    raise exception 'This login is already linked to a clinic — nothing to do.';
  end if;

  insert into clinics (name, timezone, email)
  values ('TuneUp Osteopathy', 'Australia/Melbourne', 'eliemokbel3@gmail.com')
  returning id into v_clinic;

  insert into profiles (id, clinic_id, role, first_name, last_name, title, email)
  values (v_user, v_clinic, 'owner', 'Elie', 'Mokbel', 'Osteopath', 'eliemokbel3@gmail.com');

  -- Fictional sample patients (safe to delete once real data exists).
  insert into patients
    (clinic_id, first_name, last_name, preferred_name, date_of_birth, sex, email, phone,
     address_line1, suburb, state, postcode, occupation,
     emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
     medical_history, alerts, referral_source, health_fund_name, health_fund_member_number)
  values
    (v_clinic, 'Sarah', 'Whitfield', null, '1988-04-12', 'Female', 'sarah.whitfield@example.com', '0412 555 101',
     '14 Banksia St', 'Thornbury', 'VIC', '3071', 'Graphic designer',
     'Tom Whitfield', '0412 555 102', 'Partner',
     'Chronic low back pain since 2022. L4/L5 disc bulge on MRI (2023). Otherwise well.',
     null, 'Google search', 'Bupa', 'BU4491203'),
    (v_clinic, 'James', 'Okafor', 'Jim', '1975-11-02', 'Male', 'j.okafor@example.com', '0433 555 201',
     '8/22 Errol St', 'North Melbourne', 'VIC', '3051', 'Warehouse manager',
     'Ada Okafor', '0433 555 202', 'Wife',
     'Right shoulder impingement. Type 2 diabetes, well controlled (metformin). Ex-smoker.',
     'Diabetic — check healing responses', 'GP referral (Dr Chen)', 'Medibank', 'MB2210087'),
    (v_clinic, 'Priya', 'Raman', null, '1996-07-19', 'Female', 'priya.raman@example.com', '0401 555 301',
     '3 Cedar Ct', 'Preston', 'VIC', '3072', 'Physiotherapy student',
     'Anand Raman', '0401 555 302', 'Father',
     'Recurrent neck pain and tension headaches, desk-related. Nil significant PMHx.',
     null, 'Instagram', null, null),
    (v_clinic, 'Con', 'Stavropoulos', null, '1958-02-27', 'Male', null, '0455 555 401',
     '112 High St', 'Northcote', 'VIC', '3070', 'Retired builder',
     'Maria Stavropoulos', '0455 555 402', 'Wife',
     'Bilateral knee OA. THR (left) 2021. Hypertension (ramipril). AF — on apixaban.',
     'On anticoagulants — no high-velocity techniques', 'Word of mouth', 'HCF', 'HC7731945'),
    (v_clinic, 'Emily', 'Trần', 'Em', '2001-09-30', 'Female', 'em.tran@example.com', '0422 555 501',
     '27 Rathdowne St', 'Carlton', 'VIC', '3053', 'Barista / netball player',
     'Linh Trần', '0422 555 502', 'Mother',
     'Left ankle inversion sprain (grade II) 3 weeks ago. Previous right ACL reconstruction 2019.',
     null, 'Netball club', 'ahm', 'AH1120334'),
    (v_clinic, 'Robert', 'MacLeish', 'Bob', '1969-06-14', 'Male', 'bob.macleish@example.com', '0466 555 601',
     '5 Separation St', 'Fairfield', 'VIC', '3078', 'Accountant',
     'Fiona MacLeish', '0466 555 602', 'Sister',
     'Thoracic stiffness and rib dysfunction. GORD. Keen cyclist (~200 km/week).',
     null, 'Cycling club newsletter', 'NIB', 'NB5580112'),
    (v_clinic, 'Grace', 'Nguyen', null, '1992-12-08', 'Female', 'grace.nguyen@example.com', '0477 555 701',
     '19/301 St Georges Rd', 'Fitzroy North', 'VIC', '3068', 'Nurse (night shifts)',
     'Daniel Nguyen', '0477 555 702', 'Brother',
     'Pregnancy-related pelvic girdle pain — currently 24 weeks. First pregnancy.',
     'Pregnant (24 wks) — position and technique modifications', 'Midwife recommendation', 'Bupa', 'BU9902456');

  raise notice 'Done: clinic, owner profile and 7 sample patients created.';
end $$;
