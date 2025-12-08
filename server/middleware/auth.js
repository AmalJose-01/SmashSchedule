const jwt = require("jsonwebtoken");
const AdminUser = require("../model/adminUser");

require("dotenv").config();

const auth = async (req, res, next) => {
  try {
    console.log("req.headers Authorization", req.headers.authorization);
    //  Always check for Authorization header first
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No token provided");
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    //  Extract token safely
    const token = authHeader.split(" ")[1];

    //  Verify JWT with your secret key
    const decoded = jwt.verify(token, process.env.SECURITY_KEY_JWT);
    if (!decoded) {
      console.log("Invalid token");

      return res.status(403).json({ message: "Invalid token" });
    }

    //  Find the user and ensure it exists
    const user = await AdminUser.findById(decoded.id).select("_id");
    if (!user) {
      console.log("user Not Found");

      return res.status(404).json({ status: false, message: "User not found" });
    }

    //  Attach user info to request
    req.userId = user._id;

    //  Continue to next middleware
    next();
  } catch (error) {
   //  Properly handle known JWT errors
    if (error.name === "TokenExpiredError") {
      console.error("Token expired:", error);
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    if (error.name === "JsonWebTokenError") {
      console.error(" Invalid token:", error);
      return res.status(401).json({ message: "Invalid token." });
    }

    //  Catch-all for unexpected errors
    console.error(" JWT verification failed:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = auth;
