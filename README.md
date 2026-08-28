[![DailyBoost CI](https://github.com/minkinad/cboost/actions/workflows/pages.yml/badge.svg)](https://github.com/minkinad/cboost/actions/workflows/pages.yml)
[![Nuxt 4](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt&logoColor=white)](https://nuxt.com/)

# DailyBoost 2.0

Full-stack habit tracker on Nuxt 4, PostgreSQL and Prisma, with HttpOnly cookie authentication and owner-scoped Nitro API.

## Local setup

Requires Node.js 24.15+ and Docker.

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run db:migrate
npm run dev
```

Set `NUXT_SESSION_PASSWORD` in `.env` to a random string of at least 32 characters.

## Quality gates

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Integration tests use the PostgreSQL instance from `compose.yaml`; run `npm run db:migrate:deploy` first on a fresh test database.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Data model](docs/DATA_MODEL.md)
- [Authentication](docs/AUTH.md)
- [Database and legacy migration](docs/MIGRATION.md)

Goals, Analytics 2.0, PWA and AI are intentionally deferred.
