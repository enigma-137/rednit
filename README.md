# rednit

A developer-only dating app built with Next.js 14 and Supabase. The UI is monochrome by design: black, white, gray, borders, type, and motion.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Replace the dummy values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. In Supabase, run `supabase/schema.sql` in the SQL editor.

4. Enable GitHub OAuth in Supabase Auth and set the callback URL:

```text
http://localhost:3000/api/auth/callback
```

5. Start the app:

```bash
npm run dev
```

## Current state

The app has the full MVP surface in place: GitHub login, guarded app routes, discovery swipe cards, match modal, matches list, chat UI with realtime subscription, profile editing, and avatar upload wiring.

Until real Supabase keys are configured, discovery, matches, and chat use local mock data so the interface can still be worked on.
