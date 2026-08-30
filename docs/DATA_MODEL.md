# Data model

## User

`User` stores normalized unique email, password hash, optional display name, IANA timezone and timezone-aware timestamps. Email normalization is enforced in Zod and by a database check.

## Habit aggregate

`Habit` belongs to exactly one User (`userId`, cascade delete), optionally belongs to one `Category`, and owns one `HabitSchedule` plus many `HabitEntry` records. Tracking types:

- `BOOLEAN`: `targetValue` is null; entry has no numeric value.
- `COUNT`, `DURATION`, `QUANTITY`: `targetValue > 0` and a non-empty `unit` are mandatory.

The application lists active habits by default. `archivedAt` preserves history; explicit DELETE remains available and cascades to schedule/entries.

## HabitSchedule

Schedule types are `EVERY_DAY`, `WEEKDAYS`, `TIMES_PER_WEEK`, and `INTERVAL`. Weekdays use `0..6` (Sunday through Saturday). Flexible weekly schedules use `timesPerWeek`; interval schedules require `intervalDays`.

`startDate`/`endDate` are PostgreSQL `DATE`. Database checks enforce date order and schedule shape; Zod additionally rejects duplicate weekdays.

## HabitEntry

`date` is PostgreSQL `DATE` and travels over HTTP as `YYYY-MM-DD`. It represents the user's local calendar day, not an instant at UTC midnight. Timestamps such as `createdAt` remain `TIMESTAMPTZ`.

The unique index `(habitId, date)` is the concurrency-safe invariant: two independent records for one habit/day cannot exist. `PUT` uses Prisma upsert, so repeated writes update the same row. Statuses are `PENDING`, `PARTIAL`, `COMPLETED`, `SKIPPED`, and `MISSED`.

Numeric statuses are derived from value: zero is pending, below target is partial, and target or above is completed. Skipped/missed entries cannot carry a value. Entries outside the habit schedule are rejected.

## Ownership and indexes

Habit lookup/update/delete includes both `id` and authenticated `userId`. Entry queries scope through `habit.userId`; services verify ownership before upsert. Assigning `categoryId` is accepted only when the category belongs to that same user. Cross-user access returns 404. Relevant indexes cover active habits per user, category membership, and entry date lookup.

## Category

`Category` belongs to one User and stores a per-user unique name plus optional icon and color. Users can create their own taxonomy. Deleting a category sets linked `Habit.categoryId` to null and does not delete habits.

## Goal and GoalHabit

`Goal` belongs to one User and stores title, optional description/target date, and `ACTIVE`, `COMPLETED`, or `ARCHIVED` status. `GoalHabit` is the many-to-many join between Goal and Habit. Its composite primary key prevents duplicate links and its positive decimal `weight` supports deterministic weighted progress.

Goal services verify ownership of the goal and every linked habit. Deleting a goal or habit cascades only its join records; it does not delete the other aggregate.
