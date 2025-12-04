const express = require('express');
const adminLoginController = require("../controller/adminLoginController");

const adminLoginRouter = express.Router()

adminLoginRouter.post("/loginGoogle",adminLoginController.createUserWithGoogle);
module.exports = adminLoginRouter;