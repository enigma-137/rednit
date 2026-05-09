create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text check (char_length(bio) <= 300),
  portfolio_url text,
  github_url text,
  city text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references public.profiles(id) on delete cascade not null,
  to_user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(from_user_id, to_user_id),
  check (from_user_id <> to_user_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid references public.profiles(id) on delete cascade not null,
  user_b_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_a_id, user_b_id),
  check (user_a_id < user_b_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url, github_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'preferred_username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'https://github.com/' || coalesce(new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'preferred_username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.handle_mutual_like()
returns trigger as $$
begin
  if exists (
    select 1 from public.likes
    where from_user_id = new.to_user_id
    and to_user_id = new.from_user_id
  ) then
    insert into public.matches (user_a_id, user_b_id)
    values (least(new.from_user_id, new.to_user_id), greatest(new.from_user_id, new.to_user_id))
    on conflict do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_like_inserted on public.likes;
create trigger on_like_inserted
  after insert on public.likes
  for each row execute procedure public.handle_mutual_like();

alter table public.profiles enable row level security;
alter table public.likes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;

drop policy if exists "public profiles are viewable" on public.profiles;
create policy "public profiles are viewable"
  on public.profiles for select
  using (true);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "users can create own profile" on public.profiles;
create policy "users can create own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "users see own likes" on public.likes;
create policy "users see own likes"
  on public.likes for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

drop policy if exists "users insert own likes" on public.likes;
create policy "users insert own likes"
  on public.likes for insert
  with check (auth.uid() = from_user_id);

drop policy if exists "users see own matches" on public.matches;
create policy "users see own matches"
  on public.matches for select
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

drop policy if exists "matched users can read messages" on public.messages;
create policy "matched users can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.matches
      where id = match_id
      and (user_a_id = auth.uid() or user_b_id = auth.uid())
    )
  );

drop policy if exists "matched users can send messages" on public.messages;
create policy "matched users can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.matches
      where id = match_id
      and (user_a_id = auth.uid() or user_b_id = auth.uid())
    )
  );
