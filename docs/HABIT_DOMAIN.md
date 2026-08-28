# Habit domain

The canonical pure domain implementation lives in `shared/domain/habits`. It has no Vue, Nitro, Prisma, database, browser-clock, or network dependency. Server services and frontend view mapping import the same functions.

## Tracking types and entry status

- `BOOLEAN`: `completed=false` becomes `PENDING`; `completed=true` becomes `COMPLETED`. It never stores a numeric value.
- `COUNT`: discrete repetitions, for example `32 / 50` push-ups.
- `DURATION`: elapsed amount in the selected unit, for example `22 / 30 min`.
- `QUANTITY`: measurable amount, for example `1.5 / 2 L`.
- Numeric values `<= 0` are `PENDING`, values below the positive target are `PARTIAL`, and values at or above target are `COMPLETED`.

`calculateEntryStatus()` is the only rule that creates persisted status/value pairs. `SKIPPED` is accepted only as an explicit user action and may include an optional note. Clients cannot submit `MISSED`.

`getEntryStatusForDate()` derives `MISSED` when a scheduled local calendar date is before the user's current date and has no entry (or only a persisted `PENDING` entry). A numeric `PARTIAL` entry remains partial so the recorded progress is not destroyed.

## Schedule engine

Every consumer calls `isHabitScheduledForDate(habit, schedule, date)`:

- `EVERY_DAY`: every active date.
- `WEEKDAYS`: selected weekday numbers, where Sunday is `0` and Saturday is `6`.
- `TIMES_PER_WEEK`: a flexible ISO-week quota. Dates with explicit entries reserve real slots; missing historical slots are deterministically projected onto the last free active dates of that week. `canRecordEntryForDate()` makes Today an expected/recordable slot while quota remains and delegates the final schedule decision to the canonical engine.
- `INTERVAL`: every `intervalDays` calendar days beginning at `startDate`.

All types respect inclusive `startDate` and optional `endDate`. Schedule and entry dates are `YYYY-MM-DD` calendar values, not instants.

## Timezone model

`User.timezone` stores an IANA identifier such as `Europe/Amsterdam`, `Europe/Moscow`, or `America/New_York`. An instant becomes the user's current calendar date through `getDateKeyInTimeZone(instant, timezone)`. Today, schedules, entry keys, history and metrics use that stable date; browser UTC conversion is not the domain clock.

Pure functions receive `userToday` explicitly. Tests use fixed instants and dates, so results never depend on the machine clock.

## Streaks and consistency

Habit streaks advance only on scheduled `COMPLETED` entries:

- `COMPLETED` increments the series;
- `MISSED` and an incomplete past scheduled day break it;
- `SKIPPED` neither increments nor breaks it;
- an unresolved current day does not prematurely break the previous series.

`calculateHabitStreak()` returns the current scheduled-completion series. `calculateBestHabitStreak()` returns its historical maximum.

Daily consistency is `completed / expected`. `scheduled` includes all schedule slots; an explicit skip removes that slot from `expected`, making it a neutral obligation. A perfect day requires at least one expected habit and all expected habits completed. Days containing only skips or no schedules neither increment nor break `calculatePerfectDayStreak()`.

`calculateExpectedEntries()`, `calculateDailyCompletion()`, `calculatePerfectDayStreak()`, and `calculateTrackerStats()` all use the same schedule and effective-status functions.
