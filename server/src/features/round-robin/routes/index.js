const express = require("express");
const auth = require("../../../../middleware/auth");
const RoundRobinTournamentController = require("../controllers/RoundRobinTournamentController");
const RoundRobinMemberController = require("../controllers/RoundRobinMemberController");
const RoundRobinGroupController = require("../controllers/RoundRobinGroupController");
const RoundRobinMatchController = require("../controllers/RoundRobinMatchController");
const SquarePaymentController = require("../../payments/square/SquarePaymentController");
const StripeEntryFeeController = require("../../payments/stripe/StripeEntryFeeController");

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
router.get("/tournaments/:id/matches/pdf", auth, RoundRobinMatchController.downloadMatchSchedulePdf);
router.get("/tournaments/:id/standings", auth, RoundRobinMatchController.getStandings);

// Member Bank Management
router.post("/members", auth, RoundRobinMemberController.createMember);
router.post("/members/bulk-import", auth, RoundRobinMemberController.bulkImportMembers);
router.patch("/members/bulk-membership", auth, RoundRobinMemberController.bulkSetMembership);
router.get("/members", auth, RoundRobinMemberController.getMembers);
router.get("/members/pending", auth, RoundRobinMemberController.getPendingMembers); // before /members/:memberId
router.patch("/members/:memberId/approve", auth, RoundRobinMemberController.approveMember);
router.get("/members/:memberId", auth, RoundRobinMemberController.getMemberById);
router.put("/members/:memberId", auth, RoundRobinMemberController.updateMember);
router.delete("/members/:memberId", auth, RoundRobinMemberController.deleteMember);

// Tournament Player Registration
router.post("/tournaments/:tournamentId/add-members", auth, RoundRobinMemberController.addMembersToTournament);
router.get("/tournaments/:tournamentId/players", auth, RoundRobinMemberController.getTournamentPlayers);
router.delete("/tournaments/:tournamentId/players/:playerId", auth, RoundRobinMemberController.removePlayerFromTournament);

// Match Score Recording
router.post("/matches/:matchId/score", auth, RoundRobinMatchController.recordScore);
router.post("/matches/:matchId/reset", auth, RoundRobinMatchController.resetScore);
router.put("/matches/:matchId", auth, RoundRobinMatchController.updateMatch);

// Entry fee collection — Stripe Checkout (Connect destination charge, 1% platform fee).
// Square Terminal collection is retired; old Square records still show via
// getTournamentPayments and the status endpoint.
router.post(
  "/tournaments/:tournamentId/players/:playerId/collect-payment",
  auth,
  StripeEntryFeeController.collectPayment
);
router.get("/tournaments/:tournamentId/payments", auth, SquarePaymentController.getTournamentPayments);
router.get("/payments/:paymentId/status", auth, StripeEntryFeeController.getPaymentStatus);
router.post("/payments/:paymentId/refund", auth, StripeEntryFeeController.refundPayment);

module.exports = router;
