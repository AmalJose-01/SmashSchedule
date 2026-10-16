# Master Admin (support console)

A master admin signs in once, picks an environment (Production / QA / Dev, plus Local under `npm run dev`),
sees every club in that environment, and can open any verified club's admin dashboard to help with support.

## One-time setup (per environment)

Each environment has its own database, so create the master user in **each** one with the **same** credentials
(that is what lets a single login work for all of them):

```bash
cd server
MASTER_EMAIL=you@example.com MASTER_PASSWORD='Str0ng!Passw0rd' node scripts/createMaster.js
```

Run it against the right database by pointing `MONGODB_URI` (in `server/.env`, or exported) at that environment first.
The password must satisfy the normal AdminUser rule (8+ chars, upper, lower, number, one of `@$!%*?&`).
Master accounts cannot be created through signup or Google login.

Optional server env vars: `MASTER_TOKEN_TTL` (default `8h`), `MASTER_IMPERSONATION_TTL` (default `60m`).

## Using it

1. Go to `/master/login` (not linked anywhere public). Sign in — the same credentials are tried on every environment.
2. `/master/console`: choose the environment, search clubs (name, admin email, city, club key), filter by status.
3. **Open as admin** opens that environment's own site in a new tab, signed in as the club admin, with a red
   "Support mode" bar. **Exit** signs that tab out.

## Rules in support mode

- Token lasts 60 minutes, no refresh token.
- Blocked (HTTP 403 `BLOCKED_IN_SUPPORT_MODE`): Square credentials / connect / disconnect, subscription + checkout
  payments, account deletion.
- Unverified admins can't be opened (the normal auth already rejects them) — verify them first.
- Everything is recorded in the `masterauditlogs` collection (`MasterAuditLog`): master logins (and failures),
  club list/detail views, "open as admin", and every non-GET request made with a support token.

## Code map

| Area | Files |
|---|---|
| API | `server/src/features/master/{model,services,controllers,routes}` mounted at `/api/v1/master` |
| Guards | `server/middleware/masterAuth.js`, `blockWhenImpersonating.js`, `auth.js` (sets `req.impersonatedBy`) |
| Seed | `server/scripts/createMaster.js` |
| UI | `client/src/features/master/*`, `client/src/routes/MasterRoutes.jsx`, `client/src/components/MasterProtectedRoute.jsx` |
