const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_KEY);
const sendEmail = require("../utils/sendEmail");
const AdminUser = require("../model/adminUser");  


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

if (event.type === "checkout.session.completed") {
  const session = event.data.object; 
  const customerEmail = session.customer_email; // or session.receipt_email

  const userId = session.client_reference_id || session.metadata?.userId;

  // Update user verified status
  if (userId) {
    try {
      await AdminUser.findByIdAndUpdate(userId, { isVerified: true });
      console.log("User verified successfully:", userId);
    } catch (dbErr) {
      console.log("Database update error:", dbErr);
    }
  } else {
    console.log("⚠ No userId in metadata. Cannot update verification.");
  }

  console.log("💰 Payment Success for:", customerEmail);

  // Send email
  try {
    await sendEmail(
      customerEmail,
      "Payment Successful ✅",
      `Hi, your payment of $${(session.amount_total / 100).toFixed(
        2
      )} was successful. Thank you!`
    );
    console.log("📧 Email sent successfully");
  } catch (emailError) {
    console.log("❌ Error sending email:", emailError);
  }
}

  res.sendStatus(200);
});

module.exports = router;
