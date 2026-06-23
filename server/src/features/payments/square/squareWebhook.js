const express = require("express");
const { WebhooksHelper } = require("square");
const RoundRobinPayment = require("../../round-robin/models/RoundRobinPayment");

const router = express.Router();

// Square Terminal sends `terminal.checkout.updated` events as the checkout
// moves PENDING -> IN_PROGRESS -> COMPLETED/CANCELED. Each admin's checkouts
// land on this single shared endpoint; we look the record up by Square's own
// checkout id, so no per-admin routing is needed here.
router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    const signatureHeader = req.headers["x-square-hmacsha256-signature"];
    const notificationUrl = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL || process.env.SQUARE_OAUTH_REDIRECT_URI;

    const rawBody = req.body.toString("utf8");

    if (signatureKey) {
      const isValid = await WebhooksHelper.verifySignature({
        requestBody: rawBody,
        signatureHeader,
        signatureKey,
        notificationUrl,
      });
      if (!isValid) {
        console.log("Square webhook signature invalid");
        return res.sendStatus(403);
      }
    } else {
      console.log("SQUARE_WEBHOOK_SIGNATURE_KEY not set — skipping signature verification (dev only)");
    }

    const event = JSON.parse(rawBody);

    if (event.type === "terminal.checkout.updated") {
      const checkout = event.data?.object?.checkout;
      if (checkout?.id) {
        const update = { status: checkout.status, rawWebhookEvent: event };
        if (checkout.payment_ids?.[0]) update.squarePaymentId = checkout.payment_ids[0];

        await RoundRobinPayment.findOneAndUpdate({ squareCheckoutId: checkout.id }, update);
        console.log(`Square checkout ${checkout.id} -> ${checkout.status}`);
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.log("Square webhook error:", error?.message || error);
    // Respond 200 so Square doesn't endlessly retry on our processing bugs
    return res.sendStatus(200);
  }
});

module.exports = router;
