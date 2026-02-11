-- === EDUFLOW DATABASE SETUP (CLEAN START) ===
-- คำเตือน: สคริปต์นี้จะลบข้อมูลในตารางเหล่านี้ทั้งหมดหากมีอยู่แล้วเพื่อให้รันได้สำเร็จ 100%

-- 1. ลบตารางและข้อมูลเดิม (ถ้ามี)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.view_history;
drop table if exists public.comments;
drop table if exists public.content_tags;
drop table if exists public.tags;
drop table if exists public.contents;
drop table if exists public.categories;
drop table if exists public.profiles;

-- 2. ลบ Type เดิม (ถ้ามี)
drop type if exists user_role;
drop type if exists content_type;
drop type if exists content_status;

-- 3. เปิดใช้งานส่วนขยาย UUID
create extension if not exists "uuid-ossp";

-- 4. สร้าง ENUM types
create type user_role as enum ('learner', 'creator', 'admin');
create type content_type as enum ('video', 'image', 'pdf', 'article', 'audio');
create type content_status as enum ('draft', 'pending_review', 'published');

-- 5. สร้างตาราง Profiles (เชื่อมกับระบบ Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role user_role default 'learner'::user_role,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. สร้างตาราง Categories
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. สร้างตาราง Tags
create table public.tags (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. สร้างตาราง Contents
create table public.contents (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  type content_type not null,
  url text,
  thumbnail_url text,
  status content_status default 'draft'::content_status,
  creator_id uuid references public.profiles(id) not null,
  category_id uuid references public.categories(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. สร้างตาราง Content_Tags (ตารางเชื่อมความสัมพันธ์)
create table public.content_tags (
  content_id uuid references public.contents(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (content_id, tag_id)
);

-- 10. สร้างตาราง Comments
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  content_id uuid references public.contents(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  comment_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. สร้างตาราง View History
create table public.view_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  content_id uuid references public.contents(id) not null,
  viewed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. เปิดใช้ระบบ RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.contents enable row level security;
alter table public.content_tags enable row level security;
alter table public.comments enable row level security;
alter table public.view_history enable row level security;

-- 13. สร้างนโยบายความปลอดภัย (Policies)
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

create policy "Categories and Tags readable by everyone." on public.categories for select using (true);
create policy "Tags readable by everyone." on public.tags for select using (true);

create policy "Published contents viewable by everyone." on public.contents for select using (status = 'published'::content_status);
create policy "Creators manage own contents." on public.contents for all using (auth.uid() = creator_id);

create policy "Comments readable by everyone." on public.comments for select using (true);
create policy "Authenticated can comment." on public.comments for insert with check (auth.role() = 'authenticated');

-- 14. Trigger สำหรับสร้าง Profile อัตโนมัติเมื่อมี User ใหม่
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', 'User'), 'learner');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 15. เพิ่มหมวดหมู่เริ่มต้น
insert into public.categories (name) values 
('คอมพิวเตอร์'), ('ภาษาอังกฤษ'), ('คณิตศาสตร์'), ('ศิลปะ'), ('ทั่วไป');
