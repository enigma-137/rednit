# rednit — Agent Build Prompt

> A developer-only dating app built with Next.js 14 and Supabase.  
> Pure black and white. Surgical UI. Zero color. Every pixel intentional.

---

## 1. Project Overview

Build **rednit** — a dating app exclusively for developers. GitHub OAuth is the only way in. If you don't have a GitHub account, you don't exist on this platform. The design language is **monochrome brutalist minimalism**: stark white backgrounds, pure black type and borders, razor-thin lines, zero gradients, zero color, zero decoration that doesn't serve function. Animations are surgical — fast, physics-based, purposeful.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Auth | Supabase Auth (GitHub OAuth provider) |
| Database | Supabase Postgres |
| Realtime | Supabase Realtime |
| Storage | Supabase Storage |
| Styling | Tailwind CSS (monochrome config only) |
| Animation | Framer Motion |
| Language | TypeScript |
| Deployment | Vercel |

---

## 3. Design System

### 3.1 Philosophy
**No color. No gradients. No shadows with color. No decorative elements.**  
Design communicates through: whitespace, typography weight, border thickness, and motion.

### 3.2 Palette
```css
:root {
  --black: #000000;
  --white: #FFFFFF;
  --gray-100: #F5F5F5;
  --gray-200: #E0E0E0;
  --gray-400: #999999;
  --gray-600: #555555;
  --gray-800: #222222;
}
```
That is the entire palette. Nothing else is permitted.

### 3.3 Typography
- **Display / Name**: `Neue Haas Grotesk` or `DM Sans` — weight 700, tight tracking
- **Body / Bio**: `IBM Plex Mono` — weight 400, adds a developer-native feel
- **UI Labels**: `DM Sans` — weight 500, uppercase, wide tracking (`letter-spacing: 0.1em`)
- **Font sizes**: Use a strict type scale: `12 / 14 / 16 / 20 / 24 / 32 / 48 / 64px`

### 3.4 Borders & Lines
- All borders: `1px solid #000` or `1px solid #E0E0E0`
- Use borders aggressively as a design tool — they replace shadows and depth entirely
- Cards: bordered, no border-radius (or `border-radius: 2px` maximum)
- Inputs: bottom-border only (no box borders) — underline style
- Dividers: `1px solid #E0E0E0`

### 3.5 Spacing
- Base unit: `8px`
- All spacing is multiples of 8
- Be generous — whitespace is the primary design element

### 3.6 Motion Principles
- **Swipe cards**: Physics-based drag with `Framer Motion` `drag` + `dragConstraints`. On release past threshold (120px), animate off-screen with rotation. Use `spring` physics: `stiffness: 300, damping: 20`.
- **Like/Pass indicator**: As the user drags right, a thin `1px` border on the card turns black and a `LIKE` label (monospace, uppercase) fades in top-left. Drag left: `PASS` fades in top-right. Pure black text, no color.
- **Page transitions**: `opacity` fade + `y: 8px` slide up. Duration `200ms`.
- **Matches modal**: Slides up from bottom with `spring`. The match notification is typographic only — large bold names on white, no confetti, no color.
- **Chat messages**: New messages slide in from the bottom with `y: 4px` and `opacity 0→1`.
- All animations: `ease` curve is `[0.16, 1, 0.3, 1]` (expo out) unless spring is used.

---

## 4. Database Schema

### 4.1 `profiles`
```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  avatar_url text,           -- GitHub default or uploaded override
  bio text,                  -- max 300 chars
  portfolio_url text,
  github_url text,
  city text,                 -- plain text, e.g. "Lagos" or "Berlin"
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 4.2 `likes`
```sql
create table likes (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references profiles(id) on delete cascade,
  to_user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(from_user_id, to_user_id)
);
```

### 4.3 `matches`
```sql
create table matches (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid references profiles(id) on delete cascade,
  user_b_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_a_id, user_b_id)
);
```

### 4.4 `messages`
```sql
create table messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);
```

### 4.5 Trigger — Auto-create Profile on Sign-up
```sql
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username, full_name, avatar_url, github_url)
  values (
    new.id,
    new.raw_user_meta_data->>'user_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'https://github.com/' || (new.raw_user_meta_data->>'user_name')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

### 4.6 Trigger — Auto-create Match When Mutual Like
```sql
create or replace function handle_mutual_like()
returns trigger as $$
begin
  if exists (
    select 1 from likes
    where from_user_id = new.to_user_id
    and to_user_id = new.from_user_id
  ) then
    insert into matches (user_a_id, user_b_id)
    values (least(new.from_user_id, new.to_user_id), greatest(new.from_user_id, new.to_user_id))
    on conflict do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_like_inserted
  after insert on likes
  for each row execute procedure handle_mutual_like();
```

### 4.7 Row Level Security (RLS)

Enable RLS on all tables. Key policies:

```sql
-- Profiles: public read, owner write
create policy "public profiles are viewable" on profiles for select using (true);
create policy "users can update own profile" on profiles for update using (auth.uid() = id);

-- Likes: users only see their own likes
create policy "users see own likes" on likes for select using (auth.uid() = from_user_id);
create policy "users insert own likes" on likes for insert with check (auth.uid() = from_user_id);

-- Matches: users see matches they're part of
create policy "users see own matches" on matches for select
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- Messages: only matched users can read/write
create policy "matched users can read messages" on messages for select
  using (
    exists (
      select 1 from matches
      where id = match_id
      and (user_a_id = auth.uid() or user_b_id = auth.uid())
    )
  );
create policy "matched users can send messages" on messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from matches
      where id = match_id
      and (user_a_id = auth.uid() or user_b_id = auth.uid())
    )
  );
```

---

## 5. File Structure

```
rednit/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx          # GitHub OAuth entry point
│   ├── (app)/
│   │   ├── layout.tsx            # App shell with bottom nav
│   │   ├── discover/
│   │   │   └── page.tsx          # Swipe card feed
│   │   ├── matches/
│   │   │   └── page.tsx          # Matches list
│   │   ├── chat/
│   │   │   └── [matchId]/
│   │   │       └── page.tsx      # Chat thread
│   │   └── profile/
│   │       ├── page.tsx          # View own profile
│   │       └── edit/
│   │           └── page.tsx      # Edit profile
│   └── api/
│       └── auth/
│           └── callback/
│               └── route.ts      # Supabase OAuth callback
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx             # Underline-style input
│   │   └── Divider.tsx
│   ├── cards/
│   │   ├── SwipeCard.tsx         # Draggable profile card
│   │   └── SwipeStack.tsx        # Stack of 3 cards
│   ├── chat/
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   └── ChatWindow.tsx        # Realtime subscribed
│   ├── match/
│   │   └── MatchModal.tsx        # It's a match overlay
│   ├── profile/
│   │   ├── ProfileCard.tsx
│   │   └── AvatarUpload.tsx
│   └── nav/
│       └── BottomNav.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server component client
│   │   └── middleware.ts
│   └── hooks/
│       ├── useDiscover.ts
│       ├── useMatches.ts
│       └── useChat.ts
├── middleware.ts                  # Auth guard
└── tailwind.config.ts            # Monochrome only
```

---

## 6. Page-by-Page Spec

### 6.1 Login Page (`/login`)
- Full viewport, white background
- Centered vertically and horizontally
- Large typographic logo: `rednit` — weight 900, `letter-spacing: -0.04em`, `font-size: 64px`
- Tagline below in monospace: `// for developers only`
- Single button: `[ Continue with GitHub ]` — black fill, white text, no border-radius, `font-size: 14px`, uppercase, `letter-spacing: 0.1em`
- On hover: button inverts (white fill, black border, black text) with `150ms` transition
- No illustrations, no background patterns

### 6.2 Discover Page (`/discover`)
- Full screen card stack, centered
- **SwipeCard** component:
  - White card with `1px solid #000` border
  - No border-radius
  - Contains: avatar (square, `1px solid #000` border), name (bold, 24px), city (monospace, 14px, gray), bio (monospace, 14px, 4 line clamp), GitHub icon + username (link), portfolio icon + URL (link)
  - **Drag behavior**: `Framer Motion` `drag="x"` with velocity detection
  - `LIKE` label top-left corner in monospace bold uppercase — opacity tied to `dragX > 0`, fully visible at `120px`
  - `PASS` label top-right corner — opacity tied to `dragX < 0`, fully visible at `-120px`
  - On swipe right past threshold: animate `x: 600, rotate: 15, opacity: 0` then call `handleLike()`
  - On swipe left past threshold: animate `x: -600, rotate: -15, opacity: 0` then call `handlePass()`
  - On release below threshold: spring back to `x: 0, rotate: 0`
- **SwipeStack**: renders top 3 profiles, cards 2 and 3 scaled slightly (`scale: 0.97, 0.94`) and offset down (`y: 8, 16px`) — monochrome depth effect
- Below stack: two icon buttons — `✕` (pass) and `♥` (like) — circular, `1px solid #000`, black icon on white. On hover: fill black, icon white.

### 6.3 Matches Page (`/matches`)
- List of matched profiles
- Each match row: avatar (40x40px square) + name + city + last message preview
- Rows separated by `1px solid #E0E0E0`
- Unread indicator: a `6x6px` black square (no circles) to the right
- Tap to open chat thread
- Empty state: `no matches yet.` in monospace, centered, small

### 6.4 Chat Page (`/chat/[matchId]`)
- Header: matched user's avatar + name + GitHub handle, `1px solid #000` bottom border
- Message list scrollable
- **My messages**: right-aligned, black background, white text, `0px border-radius` — rectangular bubbles
- **Their messages**: left-aligned, white background, `1px solid #000` border, black text
- Monospace font throughout
- Input: bottom-pinned, `1px solid #000` top border, underline text input + send button (black arrow `→`)
- Realtime: subscribe to `messages` table filtered by `match_id`. New messages animate in from `y: 4` to `y: 0` with opacity `0→1`

### 6.5 Profile Edit Page (`/profile/edit`)
- Underline-style inputs only — no box inputs
- Avatar: square image with `1px solid #000` border, "change photo" label below in monospace
- Upload triggers Supabase Storage upload, replaces `avatar_url` in profile
- Fields: `full_name`, `bio` (textarea, 300 char counter in monospace), `portfolio_url`, `city`
- Save button at bottom: full-width, black fill, white text, uppercase
- GitHub URL is read-only — shown as a non-editable field

### 6.6 Match Modal
- Triggered when `handle_mutual_like` creates a match row, detected via Supabase Realtime subscription on `matches`
- Full-screen overlay, white background
- Animated in from bottom: `y: 100vh → 0` with spring
- Content: two square avatars side by side with a thin `1px` black line between them
- Large text: `MATCH.` — weight 900, 64px, `letter-spacing: -0.04em`
- Below: both usernames in monospace
- Two buttons: `[ Send Message ]` and `[ Keep Swiping ]` — stacked, full width, inverted styles

---

## 7. Key Components Implementation Notes

### SwipeCard.tsx
```tsx
// Use Framer Motion's useMotionValue and useTransform
// dragX drives: rotation (-15deg to 15deg), LIKE opacity (0 to 1), PASS opacity (0 to 1)
// On dragEnd: check offset.x > 120 (like) or < -120 (pass)
// Use animate() to fly card off screen, then call callback
// The next card in stack animates scale: 0.97 → 1.0 and y: 8 → 0
```

### useChat.ts
```tsx
// Subscribe to Supabase Realtime:
supabase
  .channel(`match:${matchId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `match_id=eq.${matchId}`
  }, (payload) => {
    setMessages(prev => [...prev, payload.new])
  })
  .subscribe()
```

### Middleware (Auth Guard)
```tsx
// middleware.ts — redirect unauthenticated users to /login
// Redirect authenticated users away from /login to /discover
// Use @supabase/ssr createServerClient with cookie handling
```

---

## 8. Tailwind Config

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Only these. No blue, no indigo, nothing else.
        black: '#000000',
        white: '#FFFFFF',
        'gray-100': '#F5F5F5',
        'gray-200': '#E0E0E0',
        'gray-400': '#999999',
        'gray-600': '#555555',
        'gray-800': '#222222',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0px',  // Override — no rounded corners by default
      },
      animation: {
        'fade-up': 'fadeUp 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    }
  }
}
```

---

## 9. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # Server-side only, never exposed to client
NEXT_PUBLIC_SITE_URL=            # e.g. https://rednit.vercel.app
```

---

## 10. Supabase Storage Setup

- Create a public bucket named `avatars`
- Policy: authenticated users can upload to `avatars/{user_id}/*`
- Policy: public read on all files
- On upload: generate a unique filename `{user_id}-{timestamp}.jpg`, upload, get public URL, update `profiles.avatar_url`

---

## 11. Build Order (Recommended Sequence)

1. Supabase project setup — enable GitHub OAuth, run all SQL (schema + triggers + RLS)
2. Next.js project init — install deps, configure Tailwind, set up Supabase SSR client
3. Auth flow — login page, OAuth callback route, middleware guard
4. Profile creation flow — edit page, avatar upload
5. Discover feed — SwipeCard, SwipeStack, like/pass logic
6. Match detection — Realtime subscription, MatchModal
7. Matches list page
8. Chat — message fetch, send, Realtime subscription
9. Polish — page transitions, empty states, loading skeletons (white with animated `1px` border pulse)

---

## 12. Loading Skeletons

All skeletons are **outline-only**: empty white rectangles with `1px solid #E0E0E0` borders, animated with a `border-color` pulse from `#E0E0E0` to `#999999` and back. No shimmer, no gradient. Matches the brutalist aesthetic.

---

## 13. What NOT to Build (Scope Boundaries)

- No email/password auth — GitHub only
- No geolocation or GPS — city is a plain text field
- No push notifications (v1)
- No video/voice chat
- No read receipts (v1)
- No swipe history or undo swipe (v1)
- No premium tiers or paywalls
- No color, ever, under any circumstance