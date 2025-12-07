const express = require("express");
const teamController = require("../controller/teamController.js");

const router = express.Router();

// POST /api/v1/tournament/teams
router.post("/teams", teamController.createTeam);
router.get("/get-teams", teamController.getTeams);
router.post("/create-tournament", teamController.createTournament);
router.get("/get-tournaments", teamController.getTournaments);
router.get("/get-tournamentDetails/:tournamentId", teamController.getTournamentDetails);
router.post("/save-score", teamController.saveMatchScore);
router.delete("/delete-tournament/:tournamentId",teamController.deleteTournament)
module.exports = router;
