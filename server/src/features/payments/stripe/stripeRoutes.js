const express = require("express");
const auth = require("../../../../middleware/auth");
const { StripeConnectController } = require("./StripeConnectController");

const router = express.Router();

// Club payout onboarding (Stripe Connect Express)
router.post("/connect", auth, StripeConnectController.connect);
router.get("/status", auth, StripeConnectController.getStatus);
router.get("/dashboard", auth, StripeConnectController.dashboardLink);

module.exports = router;
