# DailyBoost 2.0 — architecture

DailyBoost — full-stack modular monolith на Nuxt 4/Nitro. PostgreSQL является единственным canonical storage; статическая GitHub Pages-сборка и fallback в localStorage больше не поддерживаются.

## Поток запроса

```text
Vue page/composable
  -> Nitro API route (session, Zod, HTTP)
    -> application service (use case, ownership)
      -> pure domain rule
        -> repository interface
          -> Prisma adapter
            -> PostgreSQL
```

Prisma разрешён только в `server/repositories/prisma` и `server/utils/prisma.ts`. API routes не выполняют запросы к БД напрямую. Domain-модули не зависят от Nuxt, Nitro или Prisma.

## Реализованные границы

- `shared/schemas`: единые Zod-контракты auth, habits, schedules, entries и legacy import.
- `server/api`: resource-oriented HTTP API.
- `server/services`: orchestration и единообразные application errors.
- `server/domain`: вычисление статуса entry, календаря расписания и mapping legacy data.
- `server/repositories`: интерфейсы; Prisma-адаптеры всегда принимают authenticated `userId` для чтения/изменения пользовательских ресурсов.
- `prisma/migrations`: единственная история изменений схемы. `prisma db push` не используется.

HabitSchedule является частью aggregate Habit: отдельного публичного schedule endpoint пока нет, а изменение schedule проходит через owner-scoped `PATCH /api/habits/:id`. HabitEntry также сначала проверяет доступ к Habit и возвращает 404 для чужого ID, не раскрывая существование ресурса.

## API

Успешные resource responses имеют форму `{ habit }`, `{ habits }`, `{ entry }`, `{ entries }` или отчёт импорта. Ошибки используют стандартный Nitro JSON error с HTTP status и `statusMessage`; Zod validation возвращает 400, domain conflicts — 409/422, отсутствие или чужой ресурс — 404.

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/session

GET    /api/habits
POST   /api/habits
GET    /api/habits/:id
PATCH  /api/habits/:id
DELETE /api/habits/:id
POST   /api/habits/:id/archive
GET    /api/habits/:id/entries
PUT    /api/habits/:id/entries/:date

POST   /api/legacy/import
```

## Runtime and delivery

Production requires Node 24.15+, PostgreSQL, `DATABASE_URL` and a stable high-entropy `NUXT_SESSION_PASSWORD`. Deployment runs `prisma migrate deploy` before starting the application. CI starts a real PostgreSQL service, applies migrations, and runs lint, typecheck, unit/integration tests and production build.

TanStack Query migration, Goals, Analytics 2.0, PWA and AI remain outside this stage.
