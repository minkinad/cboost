# HTTP API

All payloads are JSON except 204 responses. Private routes require the sealed session cookie. IDs are UUIDs, calendar dates are `YYYY-MM-DD`, reminder times are `HH:mm`, and all inputs are strictly Zod-validated.

## Authentication

| Method | Path | Result |
| --- | --- | --- |
| POST | `/api/auth/register` | create user/session, 201 |
| POST | `/api/auth/login` | verify credentials/create session |
| POST | `/api/auth/logout` | clear session, 204 |
| GET | `/api/auth/session` | current public session user |

Register/login are IP-rate-limited. Invalid credentials use generic 401 responses.

## Habits and entries

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/habits?includeArchived=false` | owned habits; entry data bounded to 120 days |
| POST | `/api/habits` | create habit and schedule, 201 |
| GET | `/api/habits/:id` | owned detail with bounded entries |
| PATCH | `/api/habits/:id` | update; optional `expectedUpdatedAt` conflict token |
| DELETE | `/api/habits/:id` | permanent cascade delete, 204 |
| POST | `/api/habits/:id/archive` | archive without losing history |
| POST | `/api/habits/:id/restore` | restore archived habit |
| GET | `/api/habits/:id/entries` | `from`, `to`, `cursor`, `limit` (1–500, default 100) |
| PUT | `/api/habits/:id/entries/:date` | idempotent daily entry upsert |

Entry pages are ordered newest-first. `nextCursor` is the last returned date and is passed back as `cursor`; the next query uses dates strictly before it. Entry PUT validates schedule membership, derived status, archive state, and future-date rules.

## Reminders

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/reminders?habitId=...` | all owned reminders or one owned habit |
| POST | `/api/habits/:id/reminders` | create `{ time, timezone, enabled? }`, 201 |
| PATCH | `/api/reminders/:id` | change time/timezone/enabled |
| DELETE | `/api/reminders/:id` | delete, 204 |

## Categories and goals

| Method | Path | Notes |
| --- | --- | --- |
| GET/POST | `/api/categories` | list/create owned categories |
| PATCH/DELETE | `/api/categories/:id` | edit/delete owned category |
| GET/POST | `/api/goals` | list/create owned goals and habit links |
| GET/PATCH/DELETE | `/api/goals/:id` | owned goal detail/lifecycle/links/delete |

Every linked category/habit must have the same authenticated owner.

## Analytics and migration

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/analytics/overview` | weekly comparison, statuses, heatmap, weekdays, habits, goals, review |
| GET | `/api/analytics/habits/:id` | owned habit 7/30/90-day metrics and streaks |
| POST | `/api/legacy/import` | transactional, idempotent legacy import |

## Responses and errors

Resource envelopes use `{ habit }`, `{ habits }`, `{ entry }`, `{ reminders }`, `{ category }`, or `{ goal }`; collection/analytics contracts live in `shared/contracts`. Common statuses:

- 400 malformed/invalid input;
- 401 missing/invalid session;
- 403 rejected browser Origin;
- 404 missing or foreign resource;
- 409 uniqueness or stale habit conflict;
- 422 valid syntax that violates habit rules;
- 429 authentication rate limit;
- 500 generic unexpected failure (details remain in server logs).
