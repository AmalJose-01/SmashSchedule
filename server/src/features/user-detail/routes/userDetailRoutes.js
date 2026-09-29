const express = require("express");
const auth = require("../../../../middleware/auth");
const userDetailController = require("../controllers/userDetailController");

const router = express.Router();

router.get("/me", auth, userDetailController.getMyDetail);
router.put("/me", auth, userDetailController.upsertMyDetail);

router.get("/clubs", auth, userDetailController.getMyClubs);
router.post("/clubs", auth, userDetailController.addMyClub);
router.patch("/clubs/:clubId", auth, userDetailController.setClubFavourite);
router.delete("/clubs/:clubId", auth, userDetailController.removeMyClub);

module.exports = router;
