const express = require("express");
const teamController = require("../controller/teamController.js");

const router = express.Router();

// POST /api/v1/tournament/teams
router.post("/teams", teamController.createTeam);
router.get("/get-tournaments", teamController.getTournaments);
router.get("/get-tournamentDetails/:tournamentId", teamController.getTournamentDetails);
module.exports = router;
