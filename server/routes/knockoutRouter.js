const express = require("express");
const knockoutController = require("../controller/knockoutController.js");

const router = express.Router();

 router.get("/get-knockout-matches/:tournamentId", knockoutController.getKnockoutMatches);

module.exports = router;
