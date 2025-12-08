const express = require("express");
const adminTeamController = require("../../controller/adminTeamController");
const auth = require("../../middleware/auth");

const router = express.Router();

 router.post("/create-tournament", auth,adminTeamController.createTournament);
 router.get("/get-tournaments",auth, adminTeamController.getTournaments);
 router.get("/get-tournamentDetails/:tournamentId",auth, adminTeamController.getTournamentDetails);
 router.post("/save-score",auth, adminTeamController.saveMatchScore);
router.delete("/delete-tournament/:tournamentId",auth,adminTeamController.deleteTournament)
 router.get("/get-teams",auth, adminTeamController.getTeams);



// router.post("/teams", teamController.createTeam);
module.exports = router;
