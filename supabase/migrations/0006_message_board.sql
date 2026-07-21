-- Clinic message board: a shared noticeboard for everyone in the clinic.
-- Distinct from the one-to-one `messages` table (direct chat between staff).

create table board_posts (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references clinics (id) on delete cascade,
  author_id  uuid references profiles (id) on delete set null,
  body       text not null,
  pinned     boolean not null default false,
  created_at timestamptz not null default now()
);
create index board_posts_clinic_idx on board_posts (clinic_id, created_at desc);

alter table board_posts enable row level security;
create policy "tenant" on board_posts
  for all using (clinic_id = auth_clinic_id()) with check (clinic_id = auth_clinic_id());
