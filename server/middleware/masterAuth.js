const jwt = require("jsonwebtoken");
const AdminUser = require("../src/features/login-signup/model/adminUser");
require("dotenv").config();

// Only a real master account may call /master/* routes. The role is re-checked
// in the database on every request (never trusted from the token alone), and
// impersonation tokens (which carry `impersonatedBy`) are rejected outright.
const masterAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.SECURITY_KEY_JWT);
    if (decoded.impersonatedBy) {
      return res.status(403).json({ message: "Master access required." });
    }
    const user = await AdminUser.findById(decoded.id).select("_id emailID accountType");
    if (!user || user.accountType !== "master") {
      return res.status(403).json({ message: "Master access required." });
    }
    req.masterId = user._id;
    req.masterEmail = user.emailID;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token." });
    }
    console.error("masterAuth error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = masterAuth;
