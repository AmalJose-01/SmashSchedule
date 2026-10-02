const express = require("express");
const teamController = require("../controller/teamController.js");
const auth = require("../middleware/auth.js");

const router = express.Router();

// POST /api/v1/tournament/teams
router.post("/teams", teamController.createTeam);
// Singles: a player joins a tournament
router.post("/players", teamController.joinAsPlayer);
// Check the tournament Secret Key (to view results)
router.post("/verify-key/:tournamentId", teamController.verifyTournamentKey);

router.get("/get-tournaments", teamController.getTournaments);
router.get("/get-tournamentDetails/:tournamentId", teamController.getTournamentDetails);
  router.get("/get-tournament-information/:tournamentId", teamController.getTournamentInformation);

module.exports = router;
