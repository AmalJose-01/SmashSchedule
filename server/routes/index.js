const express = require('express');
const teamRouter = require('./teamRouter');
const knockoutRouter = require('./knockoutRouter');
const adminLoginRouter = require('./adminLoginRouter');



const router = express();


router.use("/tournament",teamRouter);
router.use("/knockout", knockoutRouter);
router.use("/admin", adminLoginRouter);


module.exports = router;