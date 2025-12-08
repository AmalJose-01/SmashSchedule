const express = require("express");
const auth = require("../middleware/auth");
const subscriptionPaymentController = require("../controller/subscriptionPaymentController.js");
const router = express.Router();

router.post(
  "/subscription",
  auth,
  subscriptionPaymentController.subscriptionPayment);
module.exports = router;
