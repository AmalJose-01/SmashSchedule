const express = require('express');
const adminLoginController = require("../controllers/adminLoginController");
const auth = require('../../../../middleware/auth');

const adminLoginRouter = express.Router()

adminLoginRouter.post("/login", adminLoginController.login);
adminLoginRouter.post("/loginGoogle",adminLoginController.createUserWithGoogle);
adminLoginRouter.get("/getUserDetail",auth,adminLoginController.getUserDetail);

module.exports = adminLoginRouter;