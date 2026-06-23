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
  skills text[],
  looking_for text[],
  role_title text,
  company text,
  twitter_url text,
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

-- Communities
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(id) on delete set null,
  name text not null check (char_length(name) >= 3 and char_length(name) <= 50),
  slug text unique not null check (char_length(slug) >= 3),
  description text check (char_length(description) <= 500),
  avatar_url text,
  banner_url text,
  created_at timestamptz default now()
);

-- Community membership
create table if not exists public.community_members (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.communities(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member' check (role in ('admin', 'moderator', 'member')),
  created_at timestamptz default now(),
  unique(community_id, profile_id)
);

-- Posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete cascade not null,
  community_id uuid references public.communities(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz default now()
);

-- Events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(id) on delete cascade not null,
  community_id uuid references public.communities(id) on delete cascade,
  title text not null,
  description text,
  event_date timestamptz not null,
  location_type text default 'online' check (location_type in ('online', 'in_person')),
  location_details text,
  created_at timestamptz default now()
);

-- Event RSVPs
create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'going' check (status in ('going', 'maybe', 'not_going')),
  created_at timestamptz default now(),
  unique(event_id, profile_id)
);

-- Enable RLS
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;

-- Policies
drop policy if exists "public communities are viewable" on public.communities;
create policy "public communities are viewable" on public.communities for select using (true);
drop policy if exists "authenticated users can create communities" on public.communities;
create policy "authenticated users can create communities" on public.communities for insert with check (auth.uid() = creator_id);
drop policy if exists "creators can update communities" on public.communities;
create policy "creators can update communities" on public.communities for update using (auth.uid() = creator_id);

drop policy if exists "community members are viewable" on public.community_members;
create policy "community members are viewable" on public.community_members for select using (true);
drop policy if exists "users can join communities" on public.community_members;
create policy "users can join communities" on public.community_members for insert with check (auth.uid() = profile_id);
drop policy if exists "users can leave communities" on public.community_members;
create policy "users can leave communities" on public.community_members for delete using (auth.uid() = profile_id);

drop policy if exists "public posts are viewable" on public.posts;
create policy "public posts are viewable" on public.posts for select using (true);
drop policy if exists "authenticated users can create posts" on public.posts;
create policy "authenticated users can create posts" on public.posts for insert with check (auth.uid() = author_id);
drop policy if exists "authors can update own posts" on public.posts;
create policy "authors can update own posts" on public.posts for update using (auth.uid() = author_id);
drop policy if exists "authors can delete own posts" on public.posts;
create policy "authors can delete own posts" on public.posts for delete using (auth.uid() = author_id);

drop policy if exists "public comments are viewable" on public.comments;
create policy "public comments are viewable" on public.comments for select using (true);
drop policy if exists "authenticated users can create comments" on public.comments;
create policy "authenticated users can create comments" on public.comments for insert with check (auth.uid() = author_id);
drop policy if exists "authors can update own comments" on public.comments;
create policy "authors can update own comments" on public.comments for update using (auth.uid() = author_id);
drop policy if exists "authors can delete own comments" on public.comments;
create policy "authors can delete own comments" on public.comments for delete using (auth.uid() = author_id);

drop policy if exists "public events are viewable" on public.events;
create policy "public events are viewable" on public.events for select using (true);
drop policy if exists "authenticated users can create events" on public.events;
create policy "authenticated users can create events" on public.events for insert with check (auth.uid() = creator_id);

drop policy if exists "event rsvps are viewable" on public.event_rsvps;
create policy "event rsvps are viewable" on public.event_rsvps for select using (true);
drop policy if exists "users can update own rsvp" on public.event_rsvps;
create policy "users can update own rsvp" on public.event_rsvps for insert with check (auth.uid() = profile_id);
drop policy if exists "users can change own rsvp" on public.event_rsvps;
create policy "users can change own rsvp" on public.event_rsvps for update using (auth.uid() = profile_id);
drop policy if exists "users can delete own rsvp" on public.event_rsvps;
create policy "users can delete own rsvp" on public.event_rsvps for delete using (auth.uid() = profile_id);


-- Supabase Storage Setup for Avatars

-- Create avatars bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage policies
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

