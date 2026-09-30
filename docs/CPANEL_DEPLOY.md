# rallix.com.au — frontend on GoDaddy cPanel, auto-deploy from GitHub

- Frontend: https://rallix.com.au (cPanel, `public_html`)
- Backend: https://smashschedule-1.onrender.com (Render, unchanged)
- Every push to `main` that changes `client/` → GitHub Actions builds the app
  and uploads it to cPanel (`.github/workflows/deploy-frontend-cpanel.yml`).

## 1. GoDaddy DNS
Domain → DNS. If nameservers are GoDaddy's, check here; if they point to your
cPanel host, use cPanel → Zone Editor instead.
- `A` record `@` → your cPanel server IP (cPanel home page, right side "Shared IP Address")
- `CNAME` `www` → `rallix.com.au`
Remove any old `A @` / `CNAME www` pointing to Vercel (`76.76.21.21`, `cname.vercel-dns.com`).

## 2. cPanel
1. **Domains**: rallix.com.au should be the primary domain (document root `public_html`).
   If it's an add-on domain, note its document root (e.g. `public_html/rallix.com.au`).
2. Back up / remove old files in that folder (default `index.html`, `cgi-bin` can stay).
3. **FTP Accounts → Add FTP Account**
   - Log in: `deploy` (→ `deploy@rallix.com.au`)
   - Directory: the document root, e.g. `public_html` (clear the auto-filled `public_html/deploy`)
   - Strong password. Note **FTP server** from "Configure FTP Client" (usually `ftp.rallix.com.au`).
4. **SSL/TLS Status → Run AutoSSL** (covers rallix.com.au + www).

## 3. GitHub → Settings → Secrets and variables → Actions
Secrets:
| Name | Value |
|---|---|
| `CPANEL_FTP_SERVER` | `ftp.rallix.com.au` |
| `CPANEL_FTP_USERNAME` | `deploy@rallix.com.au` |
| `CPANEL_FTP_PASSWORD` | FTP password |
| `VITE_GOOGLE_CLIENT_ID` | from `client/.env` |
| `VITE_GOOGLE_API_KEY` | from `client/.env` |
| `VITE_GOOGLE_MAPS_API_KEY` | from `client/.env` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | from `client/.env` (`pk_live_…` when live) |

Variables (optional): `VITE_API_URL` (default `https://smashschedule-1.onrender.com/api/v1`),
`CPANEL_SERVER_DIR` (only if the FTP account's directory isn't the site folder; end with `/`).

## 4. Render (backend) → Environment
- `CLIENT_URL=https://rallix.com.au` (Stripe return pages, emails)
- `VITE_API_URL` (used by old subscription code) — no longer needed for redirects
- Optional `CORS_ORIGINS` for extra frontend domains (comma separated)
Save → redeploy.

## 5. Google Cloud (Sign in with Google)
APIs & Services → Credentials → OAuth 2.0 Client → Authorised JavaScript origins:
add `https://rallix.com.au` and `https://www.rallix.com.au`.
Google Maps API key → restrictions → add `https://rallix.com.au/*`.

## 6. Stripe
Settings → Business → Public details: website `https://rallix.com.au`.
Webhooks unchanged (they point at Render).

## 7. First deploy
Merge to `main` and push (or Actions → "Deploy frontend to rallix.com.au" → Run workflow).
Check https://rallix.com.au, log in, refresh a deep page (e.g. /admin/club-profile).

## Troubleshooting
- FTP TLS/login error → change `protocol: ftps` to `ftp` in the workflow.
- Blank page / API errors → browser console; CORS error means Render isn't redeployed.
- 404 on refresh → `.htaccess` missing (comes from `client/public/.htaccess`).
- Old version showing → hard refresh; index.html is served no-cache.
