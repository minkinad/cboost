# DailyBoost agent guide

This file defines the repository-wide working agreement for coding agents. It applies to every file below the repository root unless a more specific `AGENTS.md` overrides it.

## Product boundaries

- DailyBoost is a Russian-first personal habit tracker built with Nuxt 4, Vue 3, Nitro, PostgreSQL, Prisma, TanStack Query, Nuxt UI, Zod, Vitest, and Playwright.
- Preserve the focused personal-product scope. Do not add AI, social features, gamification, or external infrastructure unless the task explicitly requires it.
- PostgreSQL is the canonical source of truth. IndexedDB is only a pending offline mutation queue, never an alternative habit database.
- Use IANA timezones and stable `YYYY-MM-DD` calendar keys. Do not derive the user's day from browser UTC conversion alone.

## Architecture

- Keep pure calculations in `shared/domain/` when both client and server consume them, or `server/domain/` when they are server-only.
- Vue components render prepared state and dispatch actions. Do not duplicate schedule, status, streak, completion, goal-progress, or analytics calculations in templates or component helpers.
- Application services orchestrate use cases. Repository interfaces isolate persistence; Prisma adapters implement those interfaces.
- Validate API input with the schemas in `shared/schemas/`, return typed contracts from `shared/contracts/`, and translate expected service errors at the HTTP boundary.
- Enforce ownership server-side for every private resource. A cross-user identifier must not reveal that the resource exists.
- Avoid N+1 API and database access patterns. Analytics should be assembled by the server application service from bounded queries.

## Canonical domain rules

- Entry status comes from the canonical domain status function. Boolean `false` is pending and `true` is completed. Numeric values are pending at `<= 0`, partial below target, and completed at or above target.
- `SKIPPED` is an explicit user action. `MISSED` is calculated only for a past scheduled day without completion.
- All schedule-aware behavior must use the canonical schedule engine, including Today, history, analytics, calendars, expected entries, missed entries, and streaks.
- A completed scheduled entry increases a habit streak; missed breaks it; skipped neither increases nor breaks it.
- A perfect day requires every expected habit for that day to be completed. Daily consistency is completed expected habits divided by scheduled habits.
- Goal progress is the weighted average completion rate of linked habits over each habit's last 30 scheduled days. Never use random or event-count-based progress.

## Data and security

- Commit Prisma schema changes together with a forward migration. Preserve constraints, ownership foreign keys, idempotent entry upserts, and query-driven indexes.
- Keep list and history queries bounded. Add pagination or explicit date windows before data can grow without limit.
- Preserve sealed HttpOnly sessions, origin checks for unsafe browser mutations, production secret validation, auth throttling, and safe error normalization.
- Never log passwords, session cookies, raw secrets, or sensitive offline payloads.
- Make writes idempotent where retries are possible. Offline replay must pass through the same authentication, ownership, validation, and domain paths as online writes.

## UI work

- Reuse Nuxt UI and existing design tokens in `app/assets/styles/main.css` before introducing a new visual primitive.
- Keep desktop and mobile navigation usable and accessible. Mutation controls need meaningful labels, keyboard focus, loading state, and visible error feedback.
- Fetch server state through TanStack Query composables. Invalidate or update the narrowest relevant keys after mutations.
- Do not add optimistic behavior that can silently diverge from PostgreSQL. Offline state must remain visibly pending until confirmed.

## Tests and documentation

- Domain tests must use fixed dates and controlled clocks; they must not depend on the current system date.
- Add unit coverage for domain rules, integration coverage for persistence/ownership boundaries, and Playwright coverage for critical user workflows.
- PostgreSQL integration and E2E suites require the Docker database and deployed migrations.
- Update the relevant document under `docs/` when changing architecture, domain semantics, the data model, API behavior, security, offline sync, or user-visible workflows.
- Portfolio screenshots are real application captures. Regenerate them with `npm run screenshots` against a local server; do not replace them with invented UI mockups.

## Quality gate

Run the checks that match the change, and run the full gate before handing off a production-facing stage:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

The supported runtime is Node.js 24.15.x. If local tooling uses another Node version, report that mismatch even when checks pass. Do not hide test failures, loosen assertions, or skip gates to make a change appear green.

## Git hygiene

- Preserve user changes and unrelated work in a dirty worktree.
- Keep commits focused and use conventional prefixes such as `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `perf:`, `security:`, `ci:`, or `chore:`.
- Do not rewrite published history or use destructive reset/checkout commands without explicit approval.
