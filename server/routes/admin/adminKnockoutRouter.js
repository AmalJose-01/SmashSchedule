const auth = require("../../middleware/auth");

const express = require("express");
const adminKnockoutController = require("../../controller/adminKnockoutController");

const router = express.Router();

router.post("/create-knockout-matches",auth, adminKnockoutController.createTeamsForKnockout);
 router.get("/get-knockout-matches/:tournamentId",auth, adminKnockoutController.getKnockoutMatches);
 router.post("/saveKnockoutScore/:matchId",auth, adminKnockoutController.saveKnockoutScore);

module.exports = router;
