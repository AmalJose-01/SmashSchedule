# QA and Production Deployment Configuration

## Overview
- **QA Deployment**: https://smash-schedule-git-main-qa-amaljose-01s-projects.vercel.app → https://qa-next.onrender.com
- **Production**: https://smash-schedule.vercel.app → https://smashschedule-1.onrender.com

## Vercel Environment Variables

### For QA Deployment (Main-QA branch):
```
VITE_GOOGLE_API_KEY=<your_qa_google_key>
VITE_GOOGLE_CLIENT_ID=<your_qa_google_client_id>
VITE_STRIPE_PUBLISHABLE_KEY=<your_qa_stripe_key>
VITE_API_BASE_URL=https://qa-next.onrender.com/api/v1
```

### For Production Deployment (main branch):
```
VITE_GOOGLE_API_KEY=<your_prod_google_key>
VITE_GOOGLE_CLIENT_ID=<your_prod_google_client_id>
VITE_STRIPE_PUBLISHABLE_KEY=<your_prod_stripe_key>
VITE_API_BASE_URL=https://smashschedule-1.onrender.com/api/v1
```

## Setup Steps

1. **Go to Vercel Dashboard**
   - QA Project: Settings → Environment Variables
   - Production Project: Settings → Environment Variables

2. **Add Environment Variables** for each deployment (see above)

3. **Redeploy**
   - Trigger a new deployment or manually redeploy from Vercel dashboard

## How It Works
The `config.js` uses this priority order:
1. Explicit `VITE_API_BASE_URL` env var (if set in Vercel)
2. Auto-detect based on domain (hostname check)
3. Fallback to localhost for local development

This ensures:
- Local dev → localhost:3000
- QA deployment → qa-next.onrender.com
- Production → smashschedule-1.onrender.com
