-- Record a patient's concession category (Pensioner, Student, ...) on their
-- file. The choices are managed in Settings → Concession types.
alter table patients add column concession text;
