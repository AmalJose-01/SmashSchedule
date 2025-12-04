const express = require("express");
const knockoutController = require("../controller/knockoutController.js");

const router = express.Router();

// POST /api/v1/knockout-matches
router.post("/create-knockout-matches", knockoutController.createTeamsForKnockout);
 router.get("/get-knockout-matches/:tournamentId", knockoutController.getKnockoutMatches);
 router.post("/saveKnockoutScore/:matchId", knockoutController.saveKnockoutScore);
// router.get("/knockout-teams/:tournamentId", knockoutController.getKnockoutTeams);
// router.post("/knockout-save-score", knockoutController.saveKnockoutMatchScore);

module.exports = router;
