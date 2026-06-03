# Contributing to rednit

Thank you for helping build the next phase of rednit. This project is evolving into a developers meeting and collaboration platform, and contributions are welcome.

## Getting started

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file based on the sample values in `README.md`.
4. Run the app locally:

```bash
npm run dev
```

## Branching and commits

- Create a branch for each change, for example:
  - `feature/preview-mode`
  - `fix/middleware-public-route`
  - `chore/update-readme`
- Keep pull requests focused and small.
- Use clear commit messages describing the intent of your change.

## Pull request process

1. Push your branch to your fork.
2. Open a PR against the `main` branch.
3. Describe what changed, why it changed, and how to test it.
4. If your work touches auth or routing, note any public-only routes and preview pages.

## Code style

- Follow the existing project conventions in `app/` and `components/`.
- Use Tailwind utility classes consistently.
- Keep component props and JSX readable.

## Areas to focus on

- public preview experience at `/preview`
- onboarding and landing page messaging
- dummy profile and match preview UX
- collaboration workflows for founders, teams, and hiring

## Notes

- `/preview` should remain accessible without authentication.
- The current landing page is being rebuilt, so the login/sign-up experience is temporarily disabled.
- If you add new routes or API endpoints, update middleware rules as needed.
