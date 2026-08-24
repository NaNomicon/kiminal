# Kiminal Agent Guide

Use this file when working in the **kiminal** repository.

## What kiminal is

A clean-room product: a modern frontend for the Kimai time-tracking backend. We forked Kimai into a standalone public repo (`NaNomicon/kiminal`, AGPL-3.0). The goal is to replace Kimai's stock Bootstrap/Twig UI with a **shadcn/Tailwind SPA** (`frontend/`) that talks to Kimai's **REST API** (`/api/*`). Kimai's PHP stays as the headless backend.

- **Upstream:** `upstream` remote = `https://github.com/kimai/kimai` (pull security/feature updates). `origin` = kiminal (ours).
- **Fork notice + migration plan:** `README.md` and `docs/PLAN-kiminal-frontend.md`.

## Stack

- **Backend (preserved):** Kimai PHP — Symfony 6.4, Doctrine, Twig, PHP 8.2–8.5. REST API in `src/API/`.
- **Frontend (new):** `frontend/` — React 19, Vite 8, Tailwind v4 (CSS-first, no `tailwind.config.js`), TanStack Router (file-based, `routeTree.gen.ts` auto-generated), TanStack Query, axios, zustand, shadcn/ui. Based on `satnaing/shadcn-admin` v2.2.1.
- **Package managers:** Composer (backend), pnpm (frontend).
- **Tests:** PHPUnit (backend), Vitest (frontend).
- **Code styles:** PhpCsFixer (backend), ESLint/Prettier (frontend).

## Repository map

- `frontend/` — the SPA. This is where new UI work happens.
- `src/API/` — the JSON REST API. **Preserve.**
- `src/` (rest) — Kimai backend services, entities, controllers. Backend controllers render Twig; they are legacy UI and are being removed as the SPA takes over.
- `templates/` — Twig templates. Legacy UI, being removed. **Keep** `templates/bundles/NelmioApiDocBundle/` (API docs UI), `templates/emails/` (mailer), `templates/invoice/renderer/` + `templates/export/` (invoice/export PDF renderers — the API depends on these).
- `assets/`, `webpack.config.js`, `public/build/` — legacy frontend build. Being removed. **Keep** the `invoice`, `invoice-pdf`, `export-pdf` encore entries (PDF renderers call `encore_entry_css_source()`).
- `config/`, `migrations/`, `public/`, `tests/`, `translations/` — Kimai backend.

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

- **Frontend work lives in `frontend/`.** Do not add new UI to the Twig layer.
- Do not introduce new composer packages without prior discussion.
- Prefer services over static helper classes (backend). Keep business logic out of controllers.
- Preserve backward compatibility for upgrades pulled from upstream.
- **AGPL-3.0:** forking/customizing our own instance is free; shipping as a hosted SaaS means releasing modified source. Keep licensing headers.

## Database rules

- Doctrine entity changes affecting the schema require a migration file.
- Generate with `bin/console doctrine:migrations:diff`. Prefer `Doctrine\DBAL\Schema` over inline SQL.

## Frontend rules

- Build on the shadcn-admin shell (layout, data-table kit, ui primitives, context, hooks, lib, styles). Do not introduce new frontend frameworks without prior discussion.
- All data flows through `frontend/src/lib/api.ts` (single axios client) + TanStack Query. No ad-hoc fetch calls.
- Auth: Bearer token (`Authorization: Bearer <token>`), stored via the zustand auth store, validated against `GET /api/me`. The legacy `X-AUTH-USER`/`X-AUTH-TOKEN` headers are deprecated and removed — do not use them.
- Server-side pagination: Kimai returns `X-Total-Count`/`X-Total-Pages` headers. Tables use `manualPagination`/`manualSorting`/`manualFiltering`.
- Kimai errors are `{ message, code }` — not `{ title }`. Handle accordingly.

## Testing rules

- Every PHP class in `src/`, except interfaces, has a matching PHPUnit test. Map `src/<dir>/<Class>.php` → `tests/<dir>/<Class>Test.php`.
- Frontend: test the API client, auth store, and pure logic. Follow existing test style in the target area.

## Validation

- Backend: `./php-cs-fixer.sh core`, `./phpstan.sh core` (src/), `./phpstan.sh test` (tests/), `vendor/bin/phpunit tests/<dir>/<Test>.php`, `composer tests-unit`.
- Frontend: `pnpm lint`, `pnpm test`, `pnpm build` (in `frontend/`).
- If backend tests fail, clear stale cache: `rm -r ./var/cache/test/`.

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
