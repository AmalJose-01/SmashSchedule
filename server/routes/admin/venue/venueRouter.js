const auth = require("../../../middleware/auth");
const express = require("express");

const adminVenueController = require("../../../controller/venue/venueController");

const router = express.Router();
router.post("/create-venue", auth, adminVenueController.createVenue);
 router.get("/get-venues/:userId", auth, adminVenueController.getVenuesByUserId);
 router.put("/update-venue/:venueId", auth, adminVenueController.updateVenue);
 router.delete("/delete-venue/:venueId", auth, adminVenueController.deleteVenue);

module.exports = router;