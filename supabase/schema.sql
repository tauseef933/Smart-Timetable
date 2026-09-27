-- Smart Timetable — full schema (run in Supabase SQL editor if setting up fresh)
create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text,
  is_active boolean default true,
  created_at timestamp default now()
);

create table if not exists teacher_subjects (
  teacher_id uuid references teachers(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  primary key (teacher_id, subject_id)
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  class_name text not null,
  section text not null
);

create table if not exists timetable (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references teachers(id),
  class_id uuid references classes(id),
  subject_id uuid references subjects(id),
  day_of_week text not null,
  start_time time not null,
  end_time time not null,
  room_number text
);

create table if not exists absences (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references teachers(id),
  date date not null,
  reason text,
  created_at timestamp default now()
);

create table if not exists substitutions (
  id uuid primary key default gen_random_uuid(),
  timetable_id uuid references timetable(id),
  original_teacher_id uuid references teachers(id),
  substitute_teacher_id uuid references teachers(id),
  date date not null,
  status text default 'assigned',
  created_at timestamp default now()
);

create table if not exists app_settings (
  id uuid primary key default gen_random_uuid(),
  college_name text not null default 'Greenfield College',
  college_logo_url text,
  email_from_name text default 'Timetable Admin',
  updated_at timestamp default now()
);

insert into app_settings (college_name)
select 'Greenfield College'
where not exists (select 1 from app_settings);

alter table subjects enable row level security;
alter table teachers enable row level security;
alter table teacher_subjects enable row level security;
alter table classes enable row level security;
alter table timetable enable row level security;
alter table absences enable row level security;
alter table substitutions enable row level security;
alter table app_settings enable row level security;

do $$ begin
  create policy "Authenticated full access subjects" on subjects for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Authenticated full access teachers" on teachers for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Authenticated full access teacher_subjects" on teacher_subjects for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Authenticated full access classes" on classes for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Authenticated full access timetable" on timetable for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Authenticated full access absences" on absences for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Authenticated full access substitutions" on substitutions for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Authenticated full access app_settings" on app_settings for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
