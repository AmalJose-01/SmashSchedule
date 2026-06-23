const express = require("express");
const auth = require("../../../../middleware/auth");
const SquareOAuthController = require("./SquareOAuthController");
const SquarePaymentController = require("./SquarePaymentController");

const router = express.Router();

// Per-admin Square Developer app credentials (Application ID + Secret)
router.post("/credentials", auth, SquareOAuthController.saveCredentials);

// OAuth connection (per-admin)
router.get("/connect", auth, SquareOAuthController.connectSquare);
router.get("/callback", SquareOAuthController.squareCallback); // Square redirects here directly — no auth header available
router.get("/status", auth, SquareOAuthController.getSquareStatus);
router.post("/disconnect", auth, SquareOAuthController.disconnectSquare);

// Locations & device configuration
router.get("/locations", auth, SquarePaymentController.listLocations);
router.post("/settings", auth, SquarePaymentController.saveSquareSettings);

// Terminal device pairing (Create Device Code flow)
router.post("/device-code", auth, SquarePaymentController.createDeviceCode);
router.get("/device-code/:id", auth, SquarePaymentController.getDeviceCodeStatus);

module.exports = router;
