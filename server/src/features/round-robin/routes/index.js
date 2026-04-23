const express = require("express");
const auth = require("../../../../middleware/auth");
const RoundRobinTournamentController = require("../controllers/RoundRobinTournamentController");
const RoundRobinMemberController = require("../controllers/RoundRobinMemberController");
const RoundRobinGroupController = require("../controllers/RoundRobinGroupController");
const RoundRobinMatchController = require("../controllers/RoundRobinMatchController");

const router = express.Router();

// Tournament Management
router.post("/tournaments", auth, RoundRobinTournamentController.createTournament);
router.get("/tournaments", auth, RoundRobinTournamentController.getTournaments);
router.get("/tournaments/:id", auth, RoundRobinTournamentController.getTournamentById);
router.put("/tournaments/:id", auth, RoundRobinTournamentController.updateTournament);
router.delete("/tournaments/:id", auth, RoundRobinTournamentController.deleteTournament);
router.post("/tournaments/:id/finalize", auth, RoundRobinTournamentController.finalizeTournament);

// Group & Match Generation
router.post("/tournaments/:id/generate-groups", auth, RoundRobinGroupController.generateGroups);
router.post("/tournaments/:id/save-groups", auth, RoundRobinGroupController.saveGroups);
router.get("/tournaments/:id/groups", auth, RoundRobinGroupController.getGroups);
router.get("/tournaments/:id/matches", auth, RoundRobinMatchController.getMatches);
router.get("/tournaments/:id/standings", auth, RoundRobinMatchController.getStandings);

// Member Bank Management
router.post("/members", auth, RoundRobinMemberController.createMember);
router.post("/members/bulk-import", auth, RoundRobinMemberController.bulkImportMembers);
router.get("/members", auth, RoundRobinMemberController.getMembers);
router.get("/members/:memberId", auth, RoundRobinMemberController.getMemberById);
router.put("/members/:memberId", auth, RoundRobinMemberController.updateMember);
router.delete("/members/:memberId", auth, RoundRobinMemberController.deleteMember);

// Tournament Player Registration
router.post("/tournaments/:tournamentId/add-members", auth, RoundRobinMemberController.addMembersToTournament);
router.get("/tournaments/:tournamentId/players", auth, RoundRobinMemberController.getTournamentPlayers);
router.delete("/tournaments/:tournamentId/players/:playerId", auth, RoundRobinMemberController.removePlayerFromTournament);

// Match Score Recording
router.post("/matches/:matchId/score", auth, RoundRobinMatchController.recordScore);
router.put("/matches/:matchId", auth, RoundRobinMatchController.updateMatch);

module.exports = router;
