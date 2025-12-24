const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_KEY);
const sendEmail = require("../utils/sendEmail");
const AdminUser = require("../model/adminUser");  


router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      console.log("🔥 Stripe Webhook Hit!");

      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      // Handle checkout session completed
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        const customerEmail = session.customer_email;
        const userId = session.client_reference_id || session.metadata?.userId;

        // Update user verification in DB
        if (userId) {
          AdminUser.findByIdAndUpdate(userId, { isVerified: true })
            .then(() => console.log("User verified:", userId))
            .catch((dbErr) => console.log("DB update error:", dbErr));
        } else {
          console.log("⚠ No userId in metadata. Cannot update verification.");
        }

        console.log("💰 Payment Success for:", customerEmail);

        // Send email asynchronously
        sendEmail(
          customerEmail,
          "Payment Successful ✅",
          `Hi, your payment of $${(session.amount_total / 100).toFixed(
            2
          )} was successful. Thank you!`
        )
          .then(() => console.log("📧 Email sent successfully"))
          .catch((emailErr) => console.log("❌ Email error:", emailErr));
      }

      // Respond 200 immediately so Stripe does not retry
      return res.sendStatus(200);
    } catch (err) {
      console.log("❌ Webhook signature/processing error:", err);
      // Always send 200 to avoid Stripe marking webhook as failed
      return res.sendStatus(200);
    }
  }
);


module.exports = router;
