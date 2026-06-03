# rednit

A minimalist developers meeting app built with Next.js 14 and Supabase. The UI is monochrome by design: black, white, gray, borders, type, and motion.

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

The app is evolving from a developer dating concept into a collaborative meetup and talent discovery platform. It currently includes:

- developer-focused landing page with unauthenticated app preview
- GitHub login and route protection for authenticated sections
- discover/swipe interactions and match UI
- chat experience with realtime subscriptions
- profile editing and onboarding flows

## Preview mode

A public, unauthenticated preview is available at `/preview`. It demonstrates the app experience with a dummy profile, sample chat, and disabled action controls while the full collaboration flow is being built.

## Contributing

If you want to help build this phase of the app, the best way to start is:

1. Fork the repo and create a branch named with the feature or fix, e.g. `feature/preview-page` or `fix/middleware-public-route`.
2. Keep changes focused and use descriptive commit messages.
3. Run the app locally with `npm run dev` and verify your changes in the browser.
4. Open a pull request against `main` and include a summary of what changed and why.

### What to work on next

- polish the unauthenticated preview experience
- add real collaboration flows for team and job discovery
- improve profile cards and matching affordances
- refine onboarding copy for founders, collaborators, and hiring

### Notes

- The preview page is intentionally public so users can explore the app without logging in.
- Authenticated routes and GitHub login remain available, but the landing buttons are temporarily disabled while the app is rebuilt.
