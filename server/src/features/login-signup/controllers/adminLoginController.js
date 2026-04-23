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
        // Update account type without triggering password validation
        await AdminUser.updateOne(
          { _id: checkUserISExist._id },
          { accountType }
        );
        checkUserISExist.accountType = accountType;
      }

      console.log("checkUserISExist", checkUserISExist);

      if (!checkUserISExist) {
        console.log("Creating new user");

        checkUserISExist = await AdminUser.create({
          firstName,
          lastName,
          emailID: email,
          googleId,
          accountType,
        });
        console.log("User created:", checkUserISExist);
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

      // Success response
      res.status(201).json({
        message: "User created successfully",
        accessToken: token,
        refreshToken: refreshToken,
        user: checkUserISExist,
      });
    } catch (error) {
      console.log("createUserWithGoogle error:", error);
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password, accountType } = req.body;

      console.log("Login attempt:", { email, accountType });

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user by email
      const user = await AdminUser.findOne({ emailID: email }).select('+password');

      if (!user || !user.password) {
        return res.status(400).json({ message: "Invalid username or password" });
      }

      // Check account type match - if not, update it without triggering password validation
      if (accountType !== user.accountType) {
        await AdminUser.updateOne(
          { _id: user._id },
          { accountType }
        );
        user.accountType = accountType;
      }

      // Check password
      let isPasswordValid = false;
      try {
        isPasswordValid = await user.comparePassword(password);
        console.log("Password valid:", isPasswordValid);
      } catch (passwordError) {
        console.error("Password comparison error:", passwordError);
        return res.status(400).json({ message: "Invalid username or password" });
      }

      if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid username or password" });
      }

      // Create payload without password
      const userPayload = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailID,
      };

      // Create JWT token
      const token = jwt.sign(userPayload, process.env.SECURITY_KEY_JWT, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      });
      const refreshToken = jwt.sign(userPayload, process.env.REFRESH_KEY_JWT, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
      });

      // Success response
      res.status(200).json({
        message: "Login successful",
        accessToken: token,
        refreshToken: refreshToken,
        user: user,
      });
    } catch (error) {
      console.error("Login error details:", error.message, error.stack);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  createUserWithGoogle: async (req, res) => {
    console.log("req.body", req.body);

    try {
      const { email, firstName, lastName, googleId, accountType } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      let checkUserISExist = await AdminUser.findOne({ emailID: email });

      if (checkUserISExist && accountType !== checkUserISExist.accountType) {
        // Update account type without triggering password validation
        await AdminUser.updateOne(
          { _id: checkUserISExist._id },
          { accountType }
        );
        checkUserISExist.accountType = accountType;
      }

      console.log("checkUserISExist", checkUserISExist);

      if (!checkUserISExist) {
        console.log("Creating new user");

        checkUserISExist = await AdminUser.create({
          firstName,
          lastName,
          emailID: email,
          googleId,
          accountType,
        });
        console.log("User created:", checkUserISExist);
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

      // Success response
      res.status(201).json({
        message: "User created successfully",
        accessToken: token,
        refreshToken: refreshToken,
        user: checkUserISExist,
      });
    } catch (error) {
      console.log("createUserWithGoogle error:", error);
      console.error(error);
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
