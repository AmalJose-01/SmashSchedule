const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_KEY);

const subscriptionPaymentController = {
  subscriptionPayment: async (req, res) => {
  try {
    const { amount, userEmail, metadata } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // in cents
      currency: "usd",
      metadata, // optional
      receipt_email: userEmail,
    });

    console.log("paymentIntent", paymentIntent);

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.log("SubscriptionPayment module error", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
},
};
module.exports = subscriptionPaymentController;
