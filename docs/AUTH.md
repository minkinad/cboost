# Authentication and security

## Authentication

DailyBoost uses `nuxt-auth-utils` sealed cookie sessions.

- Registration normalizes email, validates an IANA timezone, and stores a scrypt-derived password hash.
- Login uses the same generic 401 for unknown email and wrong password and upgrades hashes when recommended.
- The session contains only `id`, `email`, `displayName`, and `timezone`.
- The cookie is HttpOnly, `SameSite=Lax`, `Secure` in production, and expires after 30 days.
- Logout clears the session cookie; no password or access token is stored in browser storage.

`NUXT_SESSION_PASSWORD` must be a stable random value of at least 32 characters. Production startup fails fast when it is missing/short. Rotating it invalidates all sessions.

## Authorization and IDOR

Page middleware is a UX redirect, not authorization. Every private API route independently requires a session. Services/repositories scope reads and mutations to `userId`; entry/reminder ownership is checked through Habit, category assignment and GoalHabit links require same-user resources, and foreign IDs return 404.

Integration coverage includes foreign habit CRUD, entries, categories, goal links, and reminders.

## Validation and error handling

All route parameters, query strings, and JSON bodies are parsed by strict Zod schemas. Domain failures map to intentional 4xx responses. Unexpected exceptions are logged server-side and returned as a generic 500 so stack traces, SQL, and internal messages do not leak to clients.

## CSRF assumptions

The current browser API is same-origin and uses `SameSite=Lax` cookies. Unsafe `/api` methods (`POST`, `PUT`, `PATCH`, `DELETE`) additionally reject an `Origin` that differs from `APP_ORIGIN` (or the request origin when not configured). Requests without Origin remain supported for trusted non-browser clients.

Set an exact HTTPS `APP_ORIGIN` in production. If cross-origin applications are introduced, replace this policy with an explicit allowlist and CSRF token design.

## Rate limiting

Registration allows 5 attempts per IP/hour; login allows 10 per IP/15 minutes and returns 429 plus `Retry-After`. The in-process limiter is bounded and sufficient for a single application instance. Multiple instances require the same policy at a shared reverse proxy/API gateway (or a shared limiter) before horizontal scaling. Redis was intentionally not introduced without that requirement.

Trust of `X-Forwarded-For` assumes a production proxy that overwrites the header. Do not expose the Node process directly while accepting arbitrary forwarded headers.

## Headers and secrets

Responses set `nosniff`, `DENY`, a restrictive frame/base/object CSP, referrer policy, permissions policy, and cross-origin opener policy. Production adds HSTS. TLS must terminate before traffic reaches the public application.

Keep `.env`, database credentials, session secrets, and backups outside version control. CI uses disposable credentials. Dependency audit output is part of the release review; high-impact advisories must be evaluated against runtime reachability before deployment.
