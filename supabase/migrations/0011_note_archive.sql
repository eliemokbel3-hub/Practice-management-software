-- Let practitioners archive a treatment note to tuck it out of the main list
-- without deleting it (clinical records are never destroyed).
alter table clinical_notes add column archived_at timestamptz;
