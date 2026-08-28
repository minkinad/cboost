# Authentication

Authentication uses `nuxt-auth-utils` sealed cookie sessions.

- Registration normalizes email, validates an IANA timezone and hashes the password with the library helper before persistence.
- Login returns the same generic 401 for an unknown email or wrong password, verifies the stored hash, and upgrades it when rehashing is recommended.
- Session payload contains only `id`, `email`, `displayName`, and `timezone`; never `passwordHash`.
- The cookie is HttpOnly, `SameSite=Lax`, `Secure` in production and has a 30-day maximum age.
- Logout clears the session cookie. No access token or password is stored in localStorage.

The global route middleware allows `/login` and `/register` anonymously and redirects all application pages to login otherwise. This is UX protection only: every private API route independently calls `requireUserSession`, then passes its `user.id` into a service/repository query.

Set a stable secret of at least 32 random characters:

```bash
NUXT_SESSION_PASSWORD='replace-with-a-long-random-production-secret'
```

Changing the secret invalidates existing sessions. Production must use HTTPS. `SameSite=Lax` plus same-origin JSON mutation requests is the current CSRF boundary; before exposing cross-origin clients, add an explicit CSRF policy. Login rate limiting belongs at the deployment/application edge and is a required hardening step before public launch.
