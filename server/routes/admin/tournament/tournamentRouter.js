const auth = require("../../../middleware/auth");
const express = require("express");
const adminTournamentController = require("../../../controller/tournament/tournamentController");

const router = express.Router();

router.get("/get-venue/:userId",auth,adminTournamentController.getVenuesByUserId);
router.get("/get-court/:userId/:venueId",auth,adminTournamentController.getCourtByVenueId);

module.exports = router;