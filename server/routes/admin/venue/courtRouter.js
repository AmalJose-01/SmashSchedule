const auth = require("../../../middleware/auth");
const express = require("express");
const adminCourtController = require("../../../controller/venue/courtController");

const router = express.Router();

router.post("/add-court", auth, adminCourtController.createCourt);
router.get("/get-courts/:venueId", auth, adminCourtController.getCourtsByVenueId);
router.delete("/delete-court/:courtId", auth, adminCourtController.deleteCourt);

module.exports = router;