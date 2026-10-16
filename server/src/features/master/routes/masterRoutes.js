const express = require("express");
const masterController = require("../controllers/masterController");
const masterAuth = require("../../../../middleware/masterAuth");

const router = express.Router();

router.post("/login", masterController.login);

// Everything below needs a real master account.
router.use(masterAuth);
router.get("/me", masterController.me);
router.get("/clubs", masterController.listClubs);
router.get("/clubs/:adminId", masterController.getClub);
router.post("/clubs/:adminId/impersonate", masterController.impersonate);

module.exports = router;
