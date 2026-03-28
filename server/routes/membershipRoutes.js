const express = require("express");
const router = express.Router();
const membershipController = require("../controller/membershipController");
const auth = require("../middleware/auth");
const multer = require("multer");

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["application/pdf", "image/jpeg", "image/png"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// ========== MEMBER ROUTES (Public / Authenticated User) ==========

// Register new member
router.post("/register", membershipController.registerMember);

// Get membership types
router.get("/types", membershipController.getMembershipTypes);

// Get all memberships for logged-in user (across clubs)
router.get("/my-memberships", auth, membershipController.getMyMemberships);

// Member Profile Routes (Authenticated)
router.get("/:memberId/profile", auth, membershipController.getMemberProfile);

router.put("/:memberId/profile", auth, membershipController.updateMemberProfile);

// Upload verification document
router.post(
  "/:memberId/upload-document",
  auth,
  upload.single("document"),
  membershipController.uploadVerificationDocument
);

// Renew membership
router.post("/:memberId/renew", auth, membershipController.renewMembership);

// Get membership history
router.get("/:memberId/history", auth, membershipController.getMembershipHistory);

// ========== ADMIN ROUTES ==========

// Get all members (with search/filter)
router.get("/admin/members", auth, membershipController.getAllMembers);

// Get pending document verifications
router.get(
  "/admin/pending-verifications",
  auth,
  membershipController.getPendingVerifications
);

// Verify member document
router.post(
  "/admin/verify-document/:documentId",
  auth,
  membershipController.verifyDocument
);

// Get expiring memberships
router.get(
  "/admin/expiring-memberships",
  auth,
  membershipController.getExpiringMemberships
);

// Get membership statistics
router.get(
  "/admin/statistics",
  auth,
  membershipController.getMembershipStats
);

// Auto expire memberships (can be triggered by cron job)
router.post(
  "/admin/auto-expire",
  auth,
  membershipController.autoExpireMembers
);

// ========== MEMBERSHIP TYPE MANAGEMENT ==========
router.post("/admin/membership-types", auth, membershipController.createMembershipType);
router.get("/admin/membership-types", auth, membershipController.getAllMembershipTypes);
router.put("/admin/membership-types/:typeId", auth, membershipController.updateMembershipType);
router.delete("/admin/membership-types/:typeId", auth, membershipController.deleteMembershipType);

module.exports = router;
