# Kiminal — Roadmap & Gap Tracker

**Status:** active development
**Date:** 2026-08-24

Kiminal is a fork of [Kimai](https://github.com/kimai/kimai) (AGPL-3.0) that replaces Kimai's Twig/Bootstrap UI with a `satnaing/shadcn-admin` SPA (`frontend/`, React 19, Vite 8, Tailwind v4, TanStack Router + Query, axios, zustand). The Kimai PHP backend stays headless — only the REST API (`src/API/`) plus invoice/export/email subsystems are preserved; the legacy Twig UI layer (`templates/` UI dirs, `assets/`, `src/Controller/`, `webpack.config.js`, session auth) is removed. Upstream updates are pulled from the Kimai repo.

Tracks what the SPA implements vs the full Kimai feature surface. Built features are done; gaps are the remaining surface; deferred items are explicitly parked with reasons.

## Backend migration (off PHP → TypeScript)

Kimai's PHP backend is being **incrementally replaced with a TypeScript backend (TanStack Start)**, same stack as the SPA. The legacy PHP backend stays running and serves every route not yet ported.

- **New API routes are built in the TS backend, fully RESTful.** Do not add PHP API routes.
- **Ported routes move from `src/API/` (PHP) to the TS backend** in the same change that touches them. Old routes are re-implemented incrementally as we have time.
- The TS backend talks to the same `kimai2_*` DB schema (Prisma/Drizzle), so porting is schema-stable, not a data migration.
- **REST contract:** new/ported routes are fully REST (correct verbs, resource-oriented, `HTTP 200/201/204/4xx`, `Location`/collection conventions). Do not carry over Kimai's non-REST quirks (e.g. `PATCH /stop`, non-standard status codes) into new endpoints.

## Auth (verified from source + docs)

- **Bearer token**: `Authorization: Bearer <token>`. X-AUTH-USER/X-AUTH-TOKEN (API passwords) deprecated since 2.54, removed ≤ July 2026.
- SPA: paste-token login → validate via `GET /api/users/me` → store in zustand auth store + cookie → Bearer interceptor. Token minted in the SPA (POST `/api/users/api-token`, shown once) or Kimai UI.
- **CORS works out of box**: `allow_origin: ['*']` on `/api/` (nelmio_cors.yaml), headers include `Authorization`, exposes pagination headers.
- Kimai errors are `{message, code, errors}` (not `{title}`).

## REST surface (MVP)

`/timesheets` (+recent/active/stop/restart), `/customers`, `/projects`, `/activities`, `/users/me`, `/users/api-token` (create/list/delete), `/config/timesheet`, `/tags`, `/ping`. Pagination via `X-Total-Count`/`X-Total-Pages` headers (server-side `manualPagination`/`manualSorting`/`manualFiltering`).

## Built (shipped in SPA)

- **Auth** — Bearer token paste → validate via `GET /api/users/me`, persisted in zustand auth store + cookie, `beforeLoad` guard on `_authenticated/`.
- **Dashboard** — `/` — today/week/month/year hour cards, 7-day bar chart, entity counts. Computed client-side from `/api/timesheets` + `/api/customers|projects|activities` (Kimai exposes no dashboard stats endpoint).
- **Active timer** — running timer widget (sidebar footer): start (project+activity), live ticking `HH:MM:SS`, stop, recent list, restart. Backed by `/api/timesheets/{active,recent,create,{id}/stop,{id}/restart}`.
- **Timesheets** — server-side table: filters (customer/project/activity/tags/exported/billable), sort, pagination, create/edit/delete + multi-delete, `full=1` relation names.
- **Projects / Activities / Customers** — server-side CRUD tables (activity filters by project).
- **Users** — server-side table, CRUD (super-admin `view_user` RBAC enforced by backend).
- **Settings** — real profile (alias/title/accountNumber/email/language/locale/timezone/color via `PATCH /api/users/{id}`), preferences, API-token manager (list/create/revoke), read-only timesheet system defaults.

## Gaps (not yet built — pure client work, no backend routes needed)

| Feature | Backend API (exists) | Notes |
|---------|---------------------|-------|
| **Teams** | `/api/teams` CRUD | team management page (members, teamlead) |
| **Favorites** | `/api/favorites` GET/POST/DELETE | save frequent timesheet filters |
| **Tags** | `/api/tags` | dedicated tag management page (currently only a timesheet filter) |
| **Reports** | `GET /api/reports/*` | usage/team/date-range reports |

## Deferred — invoice/export (build in TS backend)

Invoice create + export render are CLI-only in Kimai (no PHP HTTP routes). Rather than add PHP routes, **port them to the TS backend as fully REST endpoints** when the core surface is stable. Feasible — `InvoiceService::createModel/renderInvoice/createInvoice` and `ServiceExport::getExportItems/renderers` expose the needed machinery; the CLI commands (`InvoiceCreateCommand`, `ExportCreateCommand`) show the driving pattern; `create_invoice`/`create_export` permissions already exist.

| Feature | Planned TS endpoint |
|---------|--------------------|
| **Invoice create + render** | `POST /api/invoices` (+ preview) — builds `InvoiceQuery`, renders/persists PDF |
| **Invoice templates list** | `GET /api/invoices/templates` |
| **Export render** | `POST /api/export` — `ServiceExport` + renderers |

## Notes / known limitations

- **Settings — timesheet defaults are read-only.** Kimai has no per-user timesheet-default concept and no write route; the 5 fields shown (`trackingMode`, `defaultBeginTime`, `activeEntriesHardLimit`, `isAllowFutureTimes`, `isAllowOverlapping`) are global system config (super-admin, `kimai.yaml timesheet:` block).
- **Language/locale/timezone option lists** are not exposed by the REST API — the SPA hardcodes the language/locale map from `config/locales.php` and derives timezones from `Intl.supportedValuesOf('timeZone')`.
- **Notifications** are not exposed via REST — the settings nav no longer links a notifications form.
- **Deploy build assets** are gitignored (`/public/build/`); a fresh clone runs `pnpm build` + `encore production` at deploy.

## Not in scope

- Kimai legacy Twig UI (removed).
- Invoice/export backend — deferred to the TS backend (above).
