# Kiminal — Roadmap & Gap Tracker

**Status:** active development
**Date:** 2026-08-24

Kiminal is a fork of [Kimai](https://github.com/kimai/kimai) (AGPL-3.0) that replaces Kimai's Twig/Bootstrap UI with a `satnaing/shadcn-admin` SPA (`frontend/`, React 19, Vite 8, Tailwind v4, TanStack Router + Query, axios, zustand). The Kimai PHP backend stays headless — only the REST API (`src/API/`) plus invoice/export/email subsystems are preserved; the legacy Twig UI layer (`templates/` UI dirs, `assets/`, `src/Controller/`, `webpack.config.js`, session auth) is removed.

> **Fork relationship (important):** Kiminal is a **divergent fork, not a release-track fork.** Because it deletes ~3800 lines of upstream Kimai (46 controllers, 161 templates, `security.yaml` firewalls), every `upstream/main` merge conflicts on those deleted files. Kiminal does **not** track upstream releases; security patches from upstream must be **cherry-picked** and resolved against this diverged tree. The AGPL obligation (release modified source if shipped as SaaS) is unaffected by this.

Tracks what the SPA implements vs the full Kimai feature surface. Built features are done; gaps are the remaining surface; deferred items are explicitly parked with reasons.

## Backend migration (off PHP → TypeScript)

Kimai's PHP backend is being **incrementally replaced with a TypeScript backend (TanStack Start)**, same stack as the SPA. The legacy PHP backend stays running and serves every route not yet ported.

- **New API routes are built in the TS backend, fully RESTful.** Do not add PHP API routes.
- **Ported routes move from `src/API/` (PHP) to the TS backend** in the same change that touches them. Old routes are re-implemented incrementally as we have time.
- The TS backend talks to the same `kimai2_*` DB schema (Prisma/Drizzle). The schema is stable (no data migration), but the **Doctrine → Prisma/Drizzle mapping is a real port, not a 1:1 schema copy**: Doctrine uses PHP enum types, embedded objects, join-table inheritance, custom DBAL types (`src/Doctrine/Types/`), lifecycle callbacks, and JSON columns with PHP serialization that Prisma/Drizzle do not map natively. With 42 Doctrine entities + 72 repositories, this is a **multi-month effort**, not a quick incremental switch; the first ported route must replicate the full entity-graph behavior (cascades, orphan removal, lazy proxies), or the two ORMs will drift and silently corrupt data.
- **REST contract:** new/ported routes are fully REST (correct verbs, resource-oriented, `HTTP 200/201/204/4xx`, `Location`/collection conventions). Do not carry over Kimai's non-REST quirks (e.g. `PATCH /stop`, non-standard status codes) into new endpoints.

## Auth (verified from source + docs)

- **Bearer token**: `Authorization: Bearer <token>`. X-AUTH-USER/X-AUTH-TOKEN (API passwords) deprecated since 2.54, removed ≤ July 2026.
- SPA: paste-token login → validate via `GET /api/users/me` → store in zustand auth store + cookie → Bearer interceptor. Token minted in the SPA (POST `/api/users/api-token`, shown once) or, on a fresh install, by an admin via `bin/console kimai:user:create <user> <email> <role> --api-token <name>` (prints the token; there is no web login to bootstrap the first user).
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

> **Most impactful gap.** Invoice creation is Kimai's #1 commercial use case (freelancers billing clients). Kimai exposes invoice *list/get/download/delete* over REST but **not create** — `POST` is CLI-only (`InvoiceCreateCommand`). The SPA cannot create invoices until the TS-backend port adds `POST /api/invoices`.

Invoice create + export render are CLI-only in Kimai (no PHP HTTP routes). Rather than add PHP routes, **port them to the TS backend as fully REST endpoints** when the core surface is stable. Feasible — `InvoiceService::createModel/renderInvoice/createInvoice` and `ServiceExport::getExportItems/renderers` expose the needed machinery; the CLI commands (`InvoiceCreateCommand`, `ExportCreateCommand`) show the driving pattern; `create_invoice`/`create_export` permissions already exist.

| Feature | Planned TS endpoint |
|---------|--------------------|
| **Invoice create + render** | `POST /api/invoices` (+ preview) — builds `InvoiceQuery`, renders/persists PDF |
| **Invoice templates list** | `GET /api/invoices/templates` |
| **Export render** | `POST /api/export` — `ServiceExport` + renderers |

## Notes / known limitations

- **Settings — timesheet defaults are read-only.** Kimai has no per-user timesheet-default concept and no write route; the 5 fields shown (`trackingMode`, `defaultBeginTime`, `activeEntriesHardLimit`, `isAllowFutureTimes`, `isAllowOverlapping`) are global system config (super-admin, `kimai.yaml timesheet:` block).
- **Multi-timer hard limit is a global config choice.** `config/packages/local.yaml` sets `timesheet.active_entries.hard_limit: 3` (Kimai's default is 1, which forbids concurrent timers). The `3` is a deliberate product choice for concurrent tracking; it is **not user-configurable in the SPA** (the setting is read-only). Raise/lower it in `local.yaml`. Kimai's alternative "punch in/out" mode (`timesheet.mode: punch`) is an option if the team prefers single-timer with punch semantics.
- **Language/locale/timezone option lists** are not exposed by the REST API — the SPA hardcodes the language/locale map from `config/locales.php` and derives timezones from `Intl.supportedValuesOf('timeZone')`.
- **Notifications** are not exposed via REST — the settings nav no longer links a notifications form.
- **Keyboard shortcuts are only partially wired.** Goal: the app should be fully usable with the keyboard. Today `⌘/Ctrl+K` (search) and `⌘/Ctrl+B` (sidebar) work; the running-timer `N`/`S`/`C` are global single letters (press `S` anywhere stops a running timer) and the profile dropdown displayed `⇧⌘P`/`⌘A`/`⌘N`/`⇧⌘Q` hints that were **not wired** — those fake hints are removed until a real, conflict-free shortcut scheme is designed and implemented.
- **Deploy build assets** are gitignored (`/public/build/`); a fresh clone runs `pnpm build` + `encore production` at deploy.

## Not in scope

- Kimai legacy Twig UI (removed).
- Invoice/export backend — deferred to the TS backend (above).
