# Data model

## User

`User` stores normalized unique email, password hash, optional display name, IANA timezone and timezone-aware timestamps. Email normalization is enforced in Zod and by a database check.

## Habit aggregate

`Habit` belongs to exactly one User (`userId`, cascade delete) and owns one `HabitSchedule` plus many `HabitEntry` records. Tracking types:

- `BOOLEAN`: `targetValue` is null; entry has no numeric value.
- `COUNT`, `DURATION`, `QUANTITY`: `targetValue > 0` and a non-empty `unit` are mandatory.

The application lists active habits by default. `archivedAt` preserves history; explicit DELETE remains available and cascades to schedule/entries.

## HabitSchedule

Schedule types are `DAILY`, `WEEKLY`, and `INTERVAL`. Weekdays use `0..6` (Sunday through Saturday). A weekly schedule is either fixed weekdays or a flexible `timesPerWeek`, never both. Interval schedules require `intervalDays`.

`startDate`/`endDate` are PostgreSQL `DATE`. Database checks enforce date order and schedule shape; Zod additionally rejects duplicate weekdays.

## HabitEntry

`date` is PostgreSQL `DATE` and travels over HTTP as `YYYY-MM-DD`. It represents the user's local calendar day, not an instant at UTC midnight. Timestamps such as `createdAt` remain `TIMESTAMPTZ`.

The unique index `(habitId, date)` is the concurrency-safe invariant: two independent records for one habit/day cannot exist. `PUT` uses Prisma upsert, so repeated writes update the same row. Statuses are `PENDING`, `PARTIAL`, `COMPLETED`, `SKIPPED`, and `MISSED`.

Numeric statuses are derived from value: zero is pending, below target is partial, and target or above is completed. Skipped/missed entries cannot carry a value. Entries outside the habit schedule are rejected.

## Ownership and indexes

Habit lookup/update/delete includes both `id` and authenticated `userId`. Entry queries scope through `habit.userId`; services verify ownership before upsert. Cross-user access returns 404. Relevant indexes cover active habits per user and entry date lookup.
