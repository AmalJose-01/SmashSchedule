const express = require("express");
const auth = require("../middleware/auth");
const subscriptionPaymentController = require("../controller/subscriptionPaymentController.js");
const router = express.Router();

router.post(
  "/subscription",
  auth,
  subscriptionPaymentController.subscriptionPayment);

  router.post("/create-checkout",auth,subscriptionPaymentController.createCheckoutSession)
    router.get("/get-PaymentDetails",auth,subscriptionPaymentController.getPaymentDetails)


module.exports = router;


