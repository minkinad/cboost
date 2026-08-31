# Database and legacy migration

## Schema migrations

Local authoring:

```bash
docker compose up -d postgres
npm run db:migrate
```

CI and production apply only committed SQL:

```bash
npm run db:migrate:deploy
```

Use `prisma migrate dev --name <change>`, review generated constraints/indexes, and commit the migration. Do not use `prisma db push` as a deployment workflow. Take a verified backup before production schema changes.

The production-readiness migration creates `HabitReminder`, its ownership relation/checks/indexes, and removes the redundant non-unique HabitEntry index while retaining the unique `(habitId, date)` index.

## Deployment order

1. Back up PostgreSQL and verify restore instructions.
2. Install the lockfile with the supported Node version.
3. Run `npm run db:migrate:deploy` once.
4. Build and roll out the Node server with stable environment variables.
5. Smoke-test session creation, one entry PUT, analytics overview, manifest, and service-worker registration.

The reminder migration is additive and compatible with the immediately preceding application. Rolling back application code leaves the table unused; destructive database rollback should be avoided in favor of a forward repair migration.

## Legacy `completions[]` import

After authentication, the client can send legacy `dailyboost.tracker.v1` data once to `POST /api/legacy/import`. Each habit is identified by `(userId, legacySourceId)` and every unique completion date becomes a completed entry.

The import is transactional, bounded, validated, protected by database uniqueness, and safe to retry. Local data is deleted only after server confirmation; a confirmed marker records cutover. Invalid/network/database failures leave the source intact. Keep a backup before bulk rollout.
