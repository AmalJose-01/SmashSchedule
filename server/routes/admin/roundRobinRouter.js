const express = require("express");
const router = express.Router();
const roundRobinController = require("../../controller/roundRobinController");

router.post("/create-member", roundRobinController.createMember);
router.get("/get-members", roundRobinController.getMembers);
router.put("/update-member/:id", roundRobinController.updateMember);
router.delete("/delete-member/:id", roundRobinController.deleteMember);
router.post("/add-to-tournament", roundRobinController.addMembersToTournament);
router.post("/bulk-import", roundRobinController.bulkImportMembers);
router.get("/get-tournament-players/:tournamentId", roundRobinController.getTournamentPlayers);
router.delete("/remove-player/:tournamentId/:playerId", roundRobinController.removePlayerFromTournament);
router.post("/bulk-add-to-tournament", roundRobinController.bulkAddPlayersToTournament);

const roundRobinGroupingController = require("../../controller/roundRobinGroupingController");

router.post("/generate-groups", roundRobinGroupingController.generateGroups);
router.post("/save-groups", roundRobinGroupingController.saveGroups);
router.get("/groups/:tournamentId", roundRobinGroupingController.getGroups);
router.post("/finalize-schedule", roundRobinGroupingController.finalizeAndSchedule);

module.exports = router;
