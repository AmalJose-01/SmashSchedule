require("dotenv").config();
const jwt = require("jsonwebtoken");
const AdminUser = require("../model/adminUser")
const adminLoginController = {
    createUserWithGoogle: async (req, res) => {
    console.log("req.body", req.body);

    try {
      const { email, firstName, lastName, googleId, accountType } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      let checkUserISExist = await AdminUser.findOne({ emailID: email });

      if (checkUserISExist && accountType !== checkUserISExist.accountType) {
        return res.status(400).json({ message: "Account type mismatch" });
      }

      console.log("checkUserISExist", checkUserISExist);

      if (!checkUserISExist) {
        console.log("123445");

        checkUserISExist = await AdminUser.create({
          firstName,
          lastName,
          emailID: email,
          googleId,
          accountType,
        });
        console.log("checkUserISExist", checkUserISExist);
      }
      console.log("checkUserISExist", checkUserISExist);

      // send  response failure login with google
      if (!checkUserISExist) {
        res.status(500).json({ message: "Failed to create user/login" });
      }

      // create payload without password
      const userPayload = {
        id: checkUserISExist._id,
        firstName: checkUserISExist.firstName,
        lastName: checkUserISExist.lastName,
        email: checkUserISExist.emailID,
      };
      // Create JWT token
      const token = jwt.sign(userPayload, process.env.SECURITY_KEY_JWT, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      });
      const refreshToken = jwt.sign(userPayload, process.env.REFRESH_KEY_JWT, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
      });

      // Remove password before sending response
      // const { password: _, ...userWithoutPassword } = checkUserISExist.toObject();

      // Success response
      res.status(201).json({
        message: "User created successfully",
        accessToken: token,
        refreshToken: refreshToken,
        user: checkUserISExist,
      });
    } catch (error) {
      console.log("createUserWithGoogle", error);

      console.log(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

getUserDetail: async (req,res) => {
  {

    console.log("sghfgsdfsdghf");
    
    try {
      const userId = req.userId;

      if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
      }

      const user = await AdminUser.findById(userId);

      if (!user) {
      return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({
      message: "User details retrieved successfully",
      user: user,
      });
    } catch (error) {
      console.log("getUserDetail", error);
      res.status(500).json({ message: "Internal server error" });
    }
    }

},



}

module.exports = adminLoginController;
