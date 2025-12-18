const express = require("express");
const adminTeamController = require("../../controller/adminTeamController");
const auth = require("../../middleware/auth");

const router = express.Router();

 router.post("/create-tournament", auth,adminTeamController.createTournament);
 router.get("/get-tournaments",auth, adminTeamController.getTournaments);
  router.get("/get-tournament-information/:tournamentId",auth, adminTeamController.getTournamentInformation);
 router.post("/create-matches",auth, adminTeamController.createMatches);

 router.post("/teams", auth,adminTeamController.createMultipleTeam);

 

 router.get("/get-tournamentDetails/:tournamentId",auth, adminTeamController.getTournamentDetails);
 router.post("/save-score",auth, adminTeamController.saveMatchScore);
  router.post("/save-multiple-score",auth, adminTeamController.saveMultipleMatchScore);

router.delete("/delete-tournament/:tournamentId",auth,adminTeamController.deleteTournament)
 router.get("/get-teams/:tournamentId",auth, adminTeamController.getTeams);
router.delete("/delete-team/:teamId",auth,adminTeamController.deleteTeam)




// router.post("/teams", teamController.createTeam);
module.exports = router;
