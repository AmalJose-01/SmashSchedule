# Stripe Connect payments — setup

Clubs are paid straight to their own bank account (BSB + account number);
SmashSchedule keeps a 1% platform fee. Clubs cover Stripe's card fee.

## 1. Stripe dashboard (Webfluence account)

1. **Connect → Get started**: enable Connect, choose *Platform*, Express accounts,
   "You handle pricing". Fill the platform profile (country Australia).
2. **Connect → Settings → Branding**: add the SmashSchedule name, icon and colour
   (shown on the club onboarding page).
3. **Developers → Webhooks → Add endpoint** (twice, same URL):
   - URL: `https://<api-host>/webhook/stripe-payments`
   - Endpoint A, *Events on your account*:
     `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
     `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`
   - Endpoint B, *Events on Connected accounts*:
     `account.updated`, `account.application.deauthorized`
4. Copy each endpoint's signing secret into the env vars below.

## 2. Server `.env`

```
STRIPE_KEY=sk_test_...                      # already used for subscriptions
CLIENT_URL=https://rallix.vercel.app        # where Stripe sends people back
STRIPE_PAYMENTS_WEBHOOK_SECRET=whsec_...    # endpoint A
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...     # endpoint B
# optional — Stripe fee estimate added to the application fee (defaults: 1.7% + 30c)
STRIPE_FEE_PERCENT_BPS=170
STRIPE_FEE_FIXED_CENTS=30
```

Local testing: `stripe listen --forward-to localhost:5000/webhook/stripe-payments --forward-connect-to localhost:5000/webhook/stripe-payments`
and put the printed `whsec_...` in `STRIPE_PAYMENTS_WEBHOOK_SECRET`.

## 3. Flow

- Admin → Club Profile → **Payments** (`/admin/club-profile/payments`) → *Set up payouts* →
  Stripe onboarding (club details, ID, BSB + account number) → back, status "active".
- Admin Players table → **Collect Payment** → QR code the player scans to pay.
- Player round robin page → **Pay A$x** after joining.
- Paid rows show **Refund** (returns club share + platform fee; Stripe keeps its card fee).

## Fee maths (A$20 entry)

| | Cents |
|---|---|
| Platform fee 1% | 20 |
| Stripe fee estimate 1.7% + 30c | 64 |
| Application fee (to Webfluence) | 84 |
| Club receives | 1916 |

Code: `server/src/features/payments/stripe/`.
