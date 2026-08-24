# Kiminal Agent Guide

Use this file when working in the **kiminal** repository.

## What kiminal is

Kiminal replaces Kimai's stock Bootstrap/Twig UI with a **shadcn/Tailwind SPA** (`frontend/`, React 19 + TanStack). It is forked from [Kimai](https://github.com/kimai/kimai) into a standalone public repo (`NaNomicon/kiminal`, AGPL-3.0).

**Backend strategy — migrating off PHP.** The current backend is Kimai PHP (Symfony 6.4, Doctrine, REST API in `src/API/`). We are **incrementally replacing it with a TypeScript backend**. The chosen framework is **TanStack Start** (same stack as the SPA). The old PHP backend stays running and serves every route that has not yet been ported; new routes are re-implemented in the TS backend over time. See `docs/ROADMAP.md`.

**Porting rule:** when touching an existing API route, port it to the TS backend (TanStack Start) in the same change. Do not add or extend PHP API routes. New API routes are built in the TS backend from the start. **New/ported routes are fully RESTful** — correct verbs, resource-oriented, standard `200/201/204/4xx`, `Location`/collection conventions — and do not carry over Kimai's non-REST quirks (e.g. `PATCH /stop`).

- **Upstream:** `upstream` remote = `https://github.com/kimai/kimai` (pull security/feature updates). `origin` = kiminal (ours).
- **Roadmap:** `README.md` + `docs/ROADMAP.md`.

## Stack

- **Backend (legacy, being replaced):** Kimai PHP — Symfony 6.4, Doctrine, Twig, PHP 8.2–8.5. REST API in `src/API/`. Do not add PHP API routes.
- **Backend (new):** TanStack Start — TypeScript, server routes, **ORM (Prisma or Drizzle) against the same `kimai2_*` DB schema**.
- **Frontend:** `frontend/` — React 19, Vite 8, Tailwind v4 (CSS-first, no `tailwind.config.js`), TanStack Router (file-based, `routeTree.gen.ts` auto-generated), TanStack Query, axios, zustand, shadcn/ui. Based on `satnaing/shadcn-admin` v2.2.1.
- **Package managers:** Composer (legacy backend), pnpm (frontend + TS backend).
- **Tests:** PHPUnit (legacy backend), Vitest (frontend + TS backend).
- **Code styles:** PhpCsFixer (legacy backend), ESLint/Prettier (frontend + TS backend).

## Repository map

- `frontend/` — the SPA + (once added) the TanStack Start server layer.
- `src/API/` — legacy PHP REST API. **Preserve for now** (still serving un-ported routes); do not add new routes here.
- `src/` (rest) — Kimai PHP backend services, entities. Legacy; being ported to TS incrementally.
- `templates/` — Twig templates. Legacy UI, being removed. **Keep** `templates/bundles/NelmioApiDocBundle/`, `templates/emails/`, `templates/invoice/renderer/` + `templates/export/` (invoice/export PDF renderers — legacy API depends on these until ported).
- `assets/`, `webpack.config.js`, `public/build/` — legacy frontend build. Being removed. **Keep** the `invoice`, `invoice-pdf`, `export-pdf` encore entries while the PDF renderers still run on PHP.
- `config/`, `migrations/`, `public/`, `tests/`, `translations/` — Kimai PHP backend.

## Never touch

- `var/cache/`, `var/data/`, `var/log/` — Symfony-managed runtime state.
- `vendor/` — Composer dependencies.
- `public/bundles/` — plugin frontend assets.
- `public/build/` — generated; re-generated assets committed only by the maintainer.

## Agent workflow

- Read surrounding code before editing. Follow existing local patterns before new abstractions.
- Keep changes small and targeted. Keep code, identifiers, comments, branches, commit text, docs in English.
- **Ask before touching security-sensitive areas** — authentication, authorization, permissions.
- **Commits:** agents may create branches and commit on feature branches. Commits to `main` are made by the maintainer. Do not commit unless the task asks for it.

## Architecture rules

- **Frontend + new backend work lives in `frontend/`.** Do not add new UI to the Twig layer.
- **Do not add PHP API routes** — new routes go to TanStack Start; ported routes move from `src/API/` to the TS backend.
- Do not introduce new composer packages without prior discussion.
- Preserve backward compatibility for upgrades pulled from upstream.
- **AGPL-3.0:** forking/customizing our own instance is free; shipping as a hosted SaaS means releasing modified source. Keep licensing headers.

## Database rules

- The TS backend talks to the same `kimai2_*` schema through an **ORM (Prisma or Drizzle)**. Map the Kimai Doctrine schema (entities + repositories + meta-field tables) — do not change the schema shape.
- Doctrine entity changes affecting the schema require a migration file (`bin/console doctrine:migrations:diff`, `Doctrine\DBAL\Schema` preferred).

## Frontend rules

- Build on the shadcn-admin shell (layout, data-table kit, ui primitives, context, hooks, lib, styles). Do not introduce new frontend frameworks without prior discussion.
- All data flows through `frontend/src/lib/api.ts` (single axios client) + TanStack Query. No ad-hoc fetch calls.
- Auth: Bearer token (`Authorization: Bearer <token>`), stored via the zustand auth store, validated against `GET /api/me`. The legacy `X-AUTH-USER`/`X-AUTH-TOKEN` headers are deprecated and removed — do not use them.
- Server-side pagination: Kimai returns `X-Total-Count`/`X-Total-Pages` headers. Tables use `manualPagination`/`manualSorting`/`manualFiltering`.
- Kimai errors are `{ message, code }` — not `{ title }`. Handle accordingly.

## Testing rules

- Every PHP class in `src/`, except interfaces, has a matching PHPUnit test (legacy backend, until ported).
- Frontend + TS backend: test the API client, auth store, server routes, and pure logic. Follow existing test style in the target area.

## Validation

- Legacy backend: `./php-cs-fixer.sh core`, `./phpstan.sh core` (src/), `./phpstan.sh test` (tests/), `vendor/bin/phpunit tests/<dir>/<Test>.php`, `composer tests-unit`.
- Frontend + TS backend: `pnpm lint`, `pnpm test`, `pnpm build` (in `frontend/`).
- If legacy backend tests fail, clear stale cache: `rm -r ./var/cache/test/`.

## Git rules

- Small fixes → active `release-x.y.z` branch. Larger changes → descriptive `snake_case` feature branches.
- Agents may create branches. Commits to `main` by the maintainer only.
- Use `gh repo set-default NaNomicon/kiminal` — gh otherwise resolves base against the `upstream` remote.

## Coding conventions

- Strict comparisons (`===`, `!==`). Constructor promotion for DI. PHP attributes for routing/mapping where established.
- `camelCase` for variables/methods. 4-space indentation. Single quotes in PHP/JS/CSS unless local style requires otherwise.
- Modern HTML5, Twig, ES6+ syntax.

## Security focus

- Prevent XSS, CSRF, SQL/command injection, auth bypasses, open redirects. Rate-limit auth flows.
