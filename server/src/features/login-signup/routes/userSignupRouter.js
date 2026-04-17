const express = require("express");
const userSignupController = require("../controllers/userSignupController");

const userSignupRouter = express.Router();

userSignupRouter.post("/signup", userSignupController.signup);

module.exports = userSignupRouter;
