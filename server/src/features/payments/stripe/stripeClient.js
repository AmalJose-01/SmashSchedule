const Stripe = require("stripe");

// Platform Stripe client (the Webfluence account). Connected club accounts are
// addressed per call via `transfer_data.destination` or `{ stripeAccount }`.
const stripe = Stripe(process.env.STRIPE_KEY);

const CURRENCY = "aud";

// Where Stripe sends people back to (the React app, not the API).
const clientUrl = () => (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

module.exports = { stripe, CURRENCY, clientUrl };
