const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_KEY);
const AdminUser = require("../model/adminUser");

const subscriptionPaymentController = {
  subscriptionPayment: async (req, res) => {
    try {
      const { amount, userEmail, metadata } = req.body;

      // 1. Create PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount, // in cents
        currency: "aud",
        metadata,
        receipt_email: userEmail,
      });

      console.log("paymentIntent created:", paymentIntent);

      // 2. Return clientSecret to frontend
      res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.log("SubscriptionPayment error:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },

  createCheckoutSession: async (req, res) => {
    try {
      console.log("createCheckoutSession =========", req.body);

      const { amount, priceId } = req.body;

      if (!req.userId) {
        return res.status(400).json({ message: "Unable to retrieve data" });
      }
      const user = await AdminUser.findById({ _id: req.userId }).select(
        "_id emailID"
      );
      if (!user) {
        console.log("user Not Found");

        return res
          .status(404)
          .json({ status: false, message: "User not found" });
      }


      console.log("user",user);
      
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: "price_1Sd70SAGJ8rZb74kQKnxRd7m", quantity: 1 }],
        success_url:
          "http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "http://localhost:5173/cancel",
        customer_email: user.emailID,
        metadata: { userId: req.userId.toString() },
      });

      if (!session) {
        return res.status(400).json({ message: "Failed to create session" });
      }

      console.log("session", session);

      res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.log("createCheckoutSession error:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },

  getPaymentDetails: async (req, res) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        req.query.session_id,
        { expand: ["subscription", "customer"] }
      );

      res.status(200).json({
        status: true,
        session,
      });
    } catch (error) {
      console.log("getPaymentDetails error:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },
};
module.exports = subscriptionPaymentController;
