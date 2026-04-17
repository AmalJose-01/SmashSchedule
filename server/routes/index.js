const express = require('express');
const teamRouter = require('./teamRouter');
const knockoutRouter = require('./knockoutRouter');
const adminLoginRouter = require('../src/features/login-signup/routes/adminLoginRouter');
const userSignupRouter = require('../src/features/login-signup/routes/userSignupRouter');;
const adminTeamRouter = require('./admin/adminTeamRouter')
const adminKnockoutRouter = require("./admin/adminKnockoutRouter")
const paymentRouter = require("./paymentRouter")
const stripeWebhook = require("./stripeWebhook")
const mailTest = require("./admin/mailTest")
const membershipRouter = require("./membershipRoutes")
const clubRouter = require("./clubRoutes")

const router = express();



router.use("/tournament",teamRouter);
router.use("/knockout", knockoutRouter);
router.use("/admin", adminLoginRouter);
router.use("/user", userSignupRouter);
router.use("/admin", adminTeamRouter);
router.use("/admin", adminKnockoutRouter);
router.use("/payment", paymentRouter);
router.use("/membership", membershipRouter);
router.use("/club", clubRouter);

router.use("/mail", mailTest);


module.exports = router;