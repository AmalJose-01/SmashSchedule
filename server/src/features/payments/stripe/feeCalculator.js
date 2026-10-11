// Fee maths for club payments (all values in integer cents).
//
// Destination charges bill Stripe's processing fee to the platform, so the
// application fee = platform fee (default 1%) + an estimate of Stripe's card
// fee. That way the club covers Stripe's fee and Webfluence keeps its 1%.
//
//   applicationFee = round(amount × platformBps) + round(amount × stripeBps) + stripeFixed
//   clubNet        = amount − applicationFee
//
// Stripe AU domestic card pricing is 1.7% + A$0.30 (override with env vars if
// your Stripe pricing differs).

const DEFAULT_PLATFORM_FEE_BPS = 100; // 1%

const stripePercentBps = () => Number(process.env.STRIPE_FEE_PERCENT_BPS ?? 170);
const stripeFixedCents = () => Number(process.env.STRIPE_FEE_FIXED_CENTS ?? 30);

const toCents = (dollars) => Math.round(Number(dollars) * 100);

const calculateFees = (amountCents, platformFeeBps = DEFAULT_PLATFORM_FEE_BPS) => {
  const amount = Math.round(Number(amountCents));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw Object.assign(new Error("Amount must be greater than zero"), { status: 400 });
  }
  const bps = Number.isFinite(Number(platformFeeBps)) ? Number(platformFeeBps) : DEFAULT_PLATFORM_FEE_BPS;

  const platformFeeCents = Math.round((amount * bps) / 10000);
  const stripeFeeEstimateCents = Math.round((amount * stripePercentBps()) / 10000) + stripeFixedCents();
  const applicationFeeCents = platformFeeCents + stripeFeeEstimateCents;

  if (applicationFeeCents >= amount) {
    throw Object.assign(new Error("Amount is too small to cover the card and platform fees"), { status: 400 });
  }

  return {
    amountCents: amount,
    platformFeeBps: bps,
    platformFeeCents,
    stripeFeeEstimateCents,
    applicationFeeCents,
    clubNetCents: amount - applicationFeeCents,
  };
};

module.exports = { calculateFees, toCents, DEFAULT_PLATFORM_FEE_BPS };
