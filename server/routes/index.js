const express = require('express');
const teamRouter = require('./teamRouter');
const knockoutRouter = require('./knockoutRouter');
const adminLoginRouter = require('./admin/adminLoginRouter');
const adminTeamRouter = require('./admin/adminTeamRouter')
const adminKnockoutRouter = require("./admin/adminKnockoutRouter")
const paymentRouter = require("./paymentRouter")
const stripeWebhook = require("./stripeWebhook")


const router = express();



router.use("/tournament",teamRouter);
router.use("/knockout", knockoutRouter);
router.use("/admin", adminLoginRouter);
router.use("/admin", adminTeamRouter);
router.use("/admin", adminKnockoutRouter);
router.use("/payment", paymentRouter);


// router.use("/webhook",stripeWebhook);



module.exports = router;