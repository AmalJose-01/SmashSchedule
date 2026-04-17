require("dotenv").config();
const jwt = require("jsonwebtoken");
const AdminUser = require("../model/adminUser");

const userSignupController = {
  signup: async (req, res) => {
    try {
      const { email, password, confirmPassword } = req.body;

      if (!email || !password || !confirmPassword) {
        return res.status(400).json({ message: "Email, password, and confirm password are required" });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      const existingUser = await AdminUser.findOne({ emailID: email });
      if (existingUser) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }

      const user = await AdminUser.create({
        firstName: email.split("@")[0],
        emailID: email,
        password,
        accountType: "user",
      });
      console.log("user created:", user);

      const userPayload = {
        id: user._id,
        firstName: user.firstName,
        email: user.emailID,
      };

      const accessToken = jwt.sign(userPayload, process.env.SECURITY_KEY_JWT, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      });
      const refreshToken = jwt.sign(userPayload, process.env.REFRESH_KEY_JWT, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
      });


      
      return res.status(201).json({
        message: "Account created successfully",
        accessToken,
        refreshToken,
        user,
      });
    } catch (error) {
      console.error("userSignup error:", error);
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map((e) => e.message);
        return res.status(400).json({ message: messages[0] });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};

module.exports = userSignupController;
