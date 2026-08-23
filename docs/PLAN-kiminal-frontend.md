# Kiminal — shadcn-admin Frontend Plan

**Status:** Plan (recon complete, no code changes yet)
**Date:** 2026-08-24
**Branch:** `agent/sisyphus/kiminal-frontend`

## Goal
Replace Kimai's Twig/Bootstrap UI with a `satnaing/shadcn-admin` SPA. Preserve Kimai backend (REST API + invoice/export/email subsystems). Remove everything the UI migration orphans.

## Change
- **Add** `frontend/` — shadcn-admin v2.2.1 SPA (React 19, Vite 8, Tailwind v4, TanStack Router + Query, axios, zustand).
- **Preserve** Kimai REST API (`src/API/`), invoice/export/email subsystems, `public/index.php`, api routes, config.
- **Remove** Kimai UI layer: `templates/` (except NelmioApiDocBundle, emails, invoice/renderer, export/), `assets/`, `src/Controller/`, `webpack.config.js`, frontend deps, `public/build/` (except invoice/invoice-pdf/export-pdf entries).
- **Rewrite** `AGENTS.md` for kiminal (currently Kimai upstream governance — conflicts with goal).
- **README** fork note + upstream link.

## Auth (verified from source + docs)
- **Bearer token**: `Authorization: Bearer <token>`. X-AUTH-USER/X-AUTH-TOKEN (API passwords) deprecated since 2.54, removed ≤ July 2026.
- Token minted in Kimai UI only (25-char hex, shown once). Revoke via `DELETE /api/users/api-token/{id}`.
- SPA: paste-token login → validate via `GET /api/me` → store in cookie → Bearer interceptor.
- **CORS works out of box**: `allow_origin: ['*']` on `/api/` (nelmio_cors.yaml), headers include `Authorization`, exposes pagination headers.

## REST surface (MVP)
`/timesheets` (+recent/active/stop/restart), `/customers`, `/projects`, `/activities`, `/users/me`, `/config/timesheet`, `/tags`, `/ping`. Pagination via `X-Total-Count`/`X-Total-Pages` headers.

## Scaffold steps
1. Rewrite `AGENTS.md` for kiminal.
2. Scaffold `frontend/` from shadcn-admin v2.2.1; strip demo (clerk routes, apps/chats/tasks/dashboard features, mock data, brand-icons); remove `@clerk/react` + `@faker-js/faker`.
3. `src/lib/api.ts` — axios instance, baseURL `/api`, Bearer interceptor, typed fetchers, pagination header parsing.
4. Auth: rewrite `auth-store.ts` (token), `user-auth-form.tsx` (validate via `/api/me`), add `beforeLoad` guard on `_authenticated/route.tsx`, fix `handle-server-error.ts` for Kimai `{message, code}` shape.
5. Nav: edit `sidebar-data.ts` → Kimai sections.
6. Feature pages: clone `users/` pattern for timesheets/projects/activities/customers; swap mock for `useQuery`; switch tables to `manualPagination`/`manualSorting`/`manualFiltering` (server-side).
7. Remove Kimai UI layer (see Change). Keep `invoice`/`invoice-pdf`/`export-pdf` encore entries + their templates (PDF renderers depend on them).
8. Verify: `GET /api/ping` + `/api/me` from SPA; invoice/export PDF still render; `composer tests-unit` backend green.

## Risks / open questions
- **Deployed 2.65.0 auth**: local main still wires both X-AUTH-* and Bearer; blog says X-AUTH removed ≤ July 2026. Verify live instance is Bearer-only before finalizing.
- **`src/Controller/` removal**: check no CLI/command references a controller service (grep during execution).
- **shadcn-admin RTL-modified components**: verify before re-adding via CLI.
- **AGPL-3.0**: SPA is separate app; if distributed with modified Kimai, AGPL applies to Kimai side.

## References
- Kimai auth removal: https://www.kimai.org/en/blog/2026/removing-api-passwords
- Kimai REST docs: https://www.kimai.org/documentation/rest-api.html
- shadcn-admin: https://github.com/satnaing/shadcn-admin (HEAD e16c87f, v2.2.1)
- Kimai CORS: `config/packages/nelmio_cors.yaml`
- Kimai auth: `src/API/Authentication/{AccessTokenHandler,TokenAuthenticator,ApiRequestMatcher}.php`
- Kimai token minting: `src/Controller/ProfileController.php`
- Vault: `0-inboxes/kimai-api-auth-contract.md`
