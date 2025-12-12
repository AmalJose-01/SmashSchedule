const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_KEY);
const AdminUser = require("../model/adminUser");
const sendEmail = require("../utils/sendEmail");

router.post("/", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    console.log("🔥 Webhook Hit!");

    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

  } catch (err) {
    console.log("❌ Signature Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    console.log("💰 Payment Success for:", intent.receipt_email);


    // Send email
    try {
      await sendEmail(
        customerEmail,
        "Payment Successful ✅",
        `Hi, your payment of ${intent} was successful. Thank you!`
      );
      console.log("📧 Email sent successfully");
    } catch (emailError) {
      console.log("❌ Error sending email:", emailError);
    }



  }

  res.sendStatus(200);
});

module.exports = router;
