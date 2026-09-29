const express = require("express");
const router = express.Router();
const clubController = require("../controller/clubController");
const PlayerRoundRobinController = require("../src/features/round-robin/controllers/PlayerRoundRobinController");
const auth = require("../middleware/auth");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Admin routes (auth required)
router.get("/my-profile", auth, clubController.getMyClubProfile);
router.put("/my-profile", auth, clubController.upsertClubProfile);
router.post("/upload-logo", auth, upload.single("logo"), clubController.uploadClubLogo);
router.post("/my-profile/generate-code", auth, clubController.generateClubCode);

// Public routes (for user club search)
router.get("/search", clubController.searchClubs);
router.get("/code/:code", clubController.getClubByCode); // before /:clubId
router.get("/:clubId/events", auth, clubController.getClubEvents);
// Player read-only round robin schedule
router.get("/round-robin/:id", auth, PlayerRoundRobinController.getRoundRobinView);
router.get("/:clubId", clubController.getClubById);

module.exports = router;
