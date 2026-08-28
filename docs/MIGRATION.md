# Database and legacy migration

## PostgreSQL schema migrations

Local development:

```bash
docker compose up -d postgres
npm run db:migrate
npm run db:seed
```

Production/CI applies committed history only:

```bash
npm run db:migrate:deploy
```

Create schema changes with `prisma migrate dev --name <change>`, review the generated SQL, commit it, and apply with `migrate deploy`. Do not use `prisma db push` as a migration workflow.

The initial migration creates enums, users, habits, schedules, entries, foreign keys, indexes and database checks. `prisma/seed.ts` is intentionally empty because the application requires no shared production data.

## Legacy `completions[]` import

After a user authenticates, `useTracker` reads `dailyboost.tracker.v1` once and sends its normalized habits to `POST /api/legacy/import`. Each legacy habit is identified by `(userId, legacySourceId)`; every completion becomes a `COMPLETED` HabitEntry.

Safety properties:

- the whole import runs in a Prisma transaction;
- the legacy habit key prevents duplicate habits per user;
- duplicate completion dates are de-duplicated before persistence;
- `createMany(..., skipDuplicates: true)` plus `(habitId, date)` uniqueness protects repeats and races;
- repeated imports return skipped counts and create no extra records;
- localStorage is deleted only after a successful server response; on network, validation or transaction failure it remains intact;
- a `dailyboost.tracker.v1.migratedAt` marker records confirmed client cutover.

The importer accepts at most 1,000 habits and 20,000 completion dates per habit. Invalid dates/data fail validation without deleting the local copy. Keep a database backup before bulk production rollout.
