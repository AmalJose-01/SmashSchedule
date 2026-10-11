const express = require("express");
const RoundRobinPayment = require("../../round-robin/models/RoundRobinPayment");
const Club = require("../../../../model/club");
const { stripe } = require("./stripeClient");
const { syncAccountToClub } = require("./StripeConnectController");
const { finalizeSelfJoin } = require("./entryFeeCheckoutService");

const router = express.Router();

// Two Stripe webhook endpoints can point here:
//  • "Your account" events (checkout.session.*, charge.refunded) → STRIPE_PAYMENTS_WEBHOOK_SECRET
//  • "Connected accounts" events (account.updated)                → STRIPE_CONNECT_WEBHOOK_SECRET
// The subscription webhook at /webhook is separate and unchanged.
const secrets = () =>
  [process.env.STRIPE_PAYMENTS_WEBHOOK_SECRET, process.env.STRIPE_CONNECT_WEBHOOK_SECRET].filter(Boolean);

const verify = (rawBody, signature) => {
  let lastError = new Error("No Stripe payments webhook secret configured");
  for (const secret of secrets()) {
    try {
      return stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
};

const findPaymentForSession = (session) =>
  RoundRobinPayment.findOne({
    $or: [
      { stripeCheckoutSessionId: session.id },
      ...(session.metadata?.roundRobinPaymentId ? [{ _id: session.metadata.roundRobinPaymentId }] : []),
    ],
  });

const handlers = {
  "account.updated": async (account) => {
    await syncAccountToClub(account);
  },

  "account.application.deauthorized": async (_obj, event) => {
    if (!event.account) return;
    await Club.findOneAndUpdate(
      { stripeAccountId: event.account },
      { stripeChargesEnabled: false, stripePayoutsEnabled: false }
    );
  },

  "checkout.session.completed": async (session, event) => {
    if (session.payment_status !== "paid") return; // async methods finish later
    await handlers["checkout.session.async_payment_succeeded"](session, event);
  },

  "checkout.session.async_payment_succeeded": async (session, event) => {
    const payment = await findPaymentForSession(session);
    if (!payment || payment.status === "REFUNDED") return;
    if (payment.status !== "COMPLETED") {
      payment.status = "COMPLETED";
      payment.stripePaymentIntentId = session.payment_intent;
      payment.paidAt = new Date();
      payment.rawWebhookEvent = { id: event.id, type: event.type };
      await payment.save();
    }
    // Self-join: only now is the player added to the round robin.
    await finalizeSelfJoin(payment);
  },

  "checkout.session.async_payment_failed": async (session) => {
    const payment = await findPaymentForSession(session);
    if (payment?.status === "PENDING") {
      payment.status = "FAILED";
      await payment.save();
    }
  },

  "checkout.session.expired": async (session) => {
    const payment = await findPaymentForSession(session);
    if (payment?.status === "PENDING") {
      payment.status = "CANCELED";
      await payment.save();
    }
  },

  "charge.refunded": async (charge) => {
    if (!charge.payment_intent) return;
    const payment = await RoundRobinPayment.findOne({ stripePaymentIntentId: charge.payment_intent });
    if (!payment) return;
    payment.refundedCents = charge.amount_refunded;
    if (charge.refunded) payment.status = "REFUNDED";
    await payment.save();
  },
};

router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  let event;
  try {
    event = verify(req.body, req.headers["stripe-signature"]);
  } catch (err) {
    console.log("Stripe payments webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const handler = handlers[event.type];
    if (handler) await handler(event.data.object, event);
    return res.sendStatus(200);
  } catch (err) {
    // 500 so Stripe retries the event later
    console.log(`Stripe payments webhook ${event.type} error:`, err?.message || err);
    return res.sendStatus(500);
  }
});

module.exports = router;
