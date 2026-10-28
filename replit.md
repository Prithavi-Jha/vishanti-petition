# The Vishanti Petition

Imported React 19 + Vite 8 frontend with an Express/TypeScript server. Keep the existing stack and directory structure.

## Running on Replit

- Runtime: Node.js 24.
- Click Run to start the `Start application` workflow (`npm run dev`).
- Express listens on `0.0.0.0:5000` by default and mounts Vite in middleware mode. Vite allows proxied development hosts.
- Dependencies are installed using npm; `package-lock.json` records the installed versions.
- Type check: `npm run lint`.
- Build: `npm run build`.
- Serve the built frontend: `npm start` after building.

## Existing external services

The active frontend reads and writes directly to the imported Supabase project, configured with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the imported, git-ignored `.env`. Preserve that database; do not replace it, seed it, or apply `supabase_schema.sql` without explicit permission. Browser Supabase keys are public client keys, not service-role credentials.

The separate Express PostgreSQL API requires `SQL_HOST`, `SQL_USER`, `SQL_PASSWORD`, and `SQL_DB_NAME`. These were not supplied with the import. Until all are set, startup skips PostgreSQL seeding and database API routes return an explicit HTTP 503. `/api/health` reports whether this API is configured; it is not a database connectivity test. Configure credentials through Replit Secrets, not source code or chat. Optional Drizzle schema tooling additionally expects `SQL_ADMIN_USER` and `SQL_ADMIN_PASSWORD`. Review schema changes and the existing startup seeding behavior before connecting this API to any database.

The imported UI has existing browser-storage/sample-data fallbacks when remote services fail. Seeing the page alone does not confirm durable writes. No live data was modified during setup.

Firebase helpers remain in the import, but the current login UI queries Supabase rather than using Firebase sign-in.

## Before public use

The imported login accepts users when lookup fails or no matching record exists, uses client-side password comparisons and role selection, and the Express API has no enforced authentication (including an arbitrary SQL execution route). Do not treat the current login as secure institutional SSO. Fix authentication, server authorization, database access policies, and persistence/error handling before publishing or collecting real grievances.
