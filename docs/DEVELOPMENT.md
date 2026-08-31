# Development and operations

## Prerequisites

- Node.js 24.15.x (`package.json` rejects unsupported major versions)
- npm with the committed lockfile
- Docker/Compose or PostgreSQL 17
- Chromium dependencies for Playwright

## Bootstrap

```bash
cp .env.example .env
docker compose up -d postgres
npm ci
npm run db:migrate:deploy
npm run dev
```

Use `npm run db:migrate` only while authoring a schema change. Regenerate the Prisma client with `npm run db:generate`. PWA icons can be reproduced from the reviewed SVG mark with `npm run generate:pwa-assets`.

## Quality workflow

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run build
npm run test:e2e
```

`npm test` runs unit and integration suites. Integration/Nuxt tests and Playwright require the migrated PostgreSQL service. Playwright builds and starts the production Node output itself. CI performs the same gates on Node 24.15 with PostgreSQL 17 and Chromium.

## Project conventions

- Put reusable business calculations in `shared/domain` or `server/domain`, never templates.
- Add Zod input schemas and response contracts before exposing a route.
- Preserve 404 semantics for foreign resources and pass `userId` through services/repositories.
- Use Prisma only from repository adapters or explicit transactional migration services.
- Add indexes from actual predicates/orderings, not by field-name intuition.
- Prefer targeted TanStack cache updates/invalidations; do not duplicate server state in localStorage.
- Use fixed dates/clocks in domain tests.

## Production smoke checks

After migration and rollout, verify HTTPS cookies, register/login/logout, ownership rejection, one habit entry, analytics overview, `/manifest.webmanifest`, generated service worker, offline shell, and reconnect replay. Browser reminder delivery in this version requires the installed/open application; it is not a push-delivery guarantee.

## Dependency review

Run `npm audit` with network access during release preparation. Do not use `npm audit fix --force` without reviewing major-version and transitive runtime impact. Record accepted advisories and revisit them when Nuxt/Vite PWA upstream releases fixes.
