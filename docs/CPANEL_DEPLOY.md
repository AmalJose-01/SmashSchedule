# Rallix frontend — dev / qa / production on GoDaddy cPanel

One workflow (`.github/workflows/deploy-frontend.yml`) deploys on every push
that changes `client/`:

| Branch | Site | cPanel folder | GitHub Environment | Backend (Render) |
|---|---|---|---|---|
| `main` | https://rallix.com.au | `public_html/rallix.com.au` | `production` | https://smashschedule-1.onrender.com |
| `qa` | https://qa.rallix.com.au | `public_html/qa.rallix.com.au` | `qa` | QA service |
| `dev` | https://dev.rallix.com.au | `public_html/dev.rallix.com.au` | `dev` | Dev service |

Flow: feature branch → `dev` (test) → `qa` (sign-off) → `main` (live).
dev and qa send `noindex` so they never appear in Google.

## Per environment (repeat for qa and dev)

### cPanel
1. **Domains → Create a New Domain**: `qa.rallix.com.au` / `dev.rallix.com.au`
   (document root `public_html/<subdomain>`). DNS is added automatically;
   if not, GoDaddy DNS → `A` record `qa` / `dev` → `107.180.116.47`.
2. **FTP Accounts**: `qa_deploy` / `dev_deploy` on domain `rallix.com.au`,
   Directory exactly `public_html/qa.rallix.com.au` (or dev), copy the password.
3. **SSL/TLS Status** → Run AutoSSL for the subdomain.

### GitHub → Settings → Environments → New environment (`qa` / `dev`)
Secrets (override the repository ones):
| Name | Value |
|---|---|
| `CPANEL_FTP_SERVER` | `107.180.116.47` |
| `CPANEL_FTP_USERNAME` | `qa_deploy@rallix.com.au` / `dev_deploy@rallix.com.au` |
| `CPANEL_FTP_PASSWORD` | that account's password |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` |

Variables:
| Name | Value |
|---|---|
| `VITE_API_URL` | that environment's Render API, ending `/api/v1` (required) |

Google keys come from the repository secrets (shared).
Production uses the repository-level secrets already set up.

### Render (one backend service per environment)
- Branch: `qa` / `dev`
- `CLIENT_URL=https://qa.rallix.com.au` / `https://dev.rallix.com.au`
- Own `MONGODB_URI` (never the production database), `STRIPE_KEY=sk_test_…`,
  own Stripe webhook secrets pointing at that service's URL.
- CORS for qa/dev/prod domains is already in `server/index.js`.

### Google Cloud (OAuth client)
Add JavaScript origins `https://qa.rallix.com.au`, `https://dev.rallix.com.au`
and redirect URIs `https://<sub>.rallix.com.au/auth/google/callback`.

### Create the branches
```
git checkout main && git pull
git checkout -b dev && git push -u origin dev
git checkout -b qa  && git push -u origin qa
```

## Production (already live)
Repository secrets: `CPANEL_FTP_SERVER`, `CPANEL_FTP_USERNAME`,
`CPANEL_FTP_PASSWORD`, `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_API_KEY`,
`VITE_GOOGLE_MAPS_API_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`.
Render production: `CLIENT_URL=https://rallix.com.au`.

## Troubleshooting
- "Input required and not supplied: server" → FTP secrets missing in that environment.
- "Missing required parameter: client_id" → `VITE_GOOGLE_CLIENT_ID` secret missing; re-run.
- FTP TLS error → change `protocol: ftps` to `ftp`.
- CORS error in browser console → that Render service isn't on the latest code.
