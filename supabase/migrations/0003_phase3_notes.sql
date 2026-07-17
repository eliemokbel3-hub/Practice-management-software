-- Phase 3: clinical notes. Default note template per appointment type, plus
-- TuneUp's two note templates recreated from their Cliniko structure.

alter table appointment_types
  add column default_note_template_id uuid references note_templates (id) on delete set null;

do $$
declare
  v_clinic uuid;
  v_standard uuid;
  v_initial uuid;
begin
  select id into v_clinic from clinics where name = 'TuneUp Osteopathy';
  if v_clinic is null then
    raise exception 'Clinic not found — run earlier seeds first.';
  end if;
  if exists (select 1 from note_templates where clinic_id = v_clinic) then
    raise exception 'Note templates already exist — nothing to do.';
  end if;

  insert into note_templates (clinic_id, name, is_default, sections) values (
    v_clinic, 'Standard Consultation', true,
    '[
      {"key":"history","label":"History","questions":[
        {"key":"presenting","label":"Presenting complaint / patient progress","type":"paragraph",
         "prefill":"Site - \nChron - \nSensory - \nAgg - \nRel - \nGeneral (Occupation, Exercise, sleep, alcohol, drug) - \nAssoc ssx - "}
      ]},
      {"key":"examination","label":"Examination","questions":[
        {"key":"assessment","label":"Assessment","type":"paragraph"},
        {"key":"consent","label":"Informed Consent","type":"checkbox",
         "text":"Working diagnosis, benefits and risks for all relevant treatment techniques have been explained and consent has been gained."},
        {"key":"diagnosis","label":"Diagnosis","type":"paragraph"}
      ]},
      {"key":"treatment","label":"Treatment / Management","questions":[
        {"key":"treatment","label":"Treatment","type":"paragraph"},
        {"key":"response","label":"Response to treatment","type":"paragraph"},
        {"key":"management","label":"Management / Advice","type":"paragraph"}
      ]}
    ]'::jsonb
  ) returning id into v_standard;

  insert into note_templates (clinic_id, name, is_default, sections) values (
    v_clinic, 'Initial Consultation', false,
    '[
      {"key":"history","label":"History","questions":[
        {"key":"presenting","label":"Presenting complaint","type":"paragraph",
         "prefill":"Site - \nChron - \nSensory - \nAgg - \nRel - \nGeneral (Occupation, Exercise, sleep, alcohol, drug) - \nAssoc ssx - "},
        {"key":"medical_history","label":"Medical History","type":"paragraph",
         "prefill":"Imaging: \nCardio: \nRespiratory: \nAccidents/Operations: \nBowel/Bladder: \nAbdo: \nReproductive: \nCo-morbidities: \nMedication/Supplements: \nChildren: \nFamily Hx: "}
      ]},
      {"key":"examination","label":"Examination","questions":[
        {"key":"assessment","label":"Assessment","type":"paragraph"},
        {"key":"consent","label":"Informed Consent","type":"checkbox",
         "text":"Working diagnosis, benefits and risks for all relevant treatment techniques have been explained and consent has been gained."},
        {"key":"diagnosis","label":"Diagnosis","type":"paragraph"}
      ]},
      {"key":"treatment","label":"Treatment / Management","questions":[
        {"key":"treatment","label":"Treatment","type":"paragraph"},
        {"key":"response","label":"Response to treatment","type":"paragraph"},
        {"key":"management","label":"Management / Advice","type":"paragraph"}
      ]}
    ]'::jsonb
  ) returning id into v_initial;

  -- Initial-style appointments open the Initial template; everything else Standard.
  update appointment_types
     set default_note_template_id = case
       when name ilike '%initial%' then v_initial
       else v_standard
     end
   where clinic_id = v_clinic;

  raise notice 'Done: 2 note templates seeded and linked to appointment types.';
end $$;
