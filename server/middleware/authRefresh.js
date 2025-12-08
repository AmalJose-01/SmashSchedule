require("dotenv").config();
const jwt = require("jsonwebtoken");

const authRefresh = async (req, res, next) => {
  try {
    console.log("req", req.headers);

const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return res.status(401).json({ message: "No refresh token provided." });
}

    const refreshToken = req.headers.authorization.split(" ")[1];
    console.log("refreshToken", refreshToken);

    if (!refreshToken) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided" });
    }

    const verifyToken = jwt.verify(refreshToken, process.env.REFRESH_KEY_JWT);
    console.log("verifyToken", verifyToken);
    if (!verifyToken) {
      res.status(403).json({ message: "Invalid token." });
    }

 req.verifiedToken = verifyToken;

    next();
  } catch (error) {
    // ✅ Properly handle known JWT errors
    if (error.name === "TokenExpiredError") {
      console.error("⏰ Token expired:", error);
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    if (error.name === "JsonWebTokenError") {
      console.error("❌ Invalid token:", error);
      return res.status(401).json({ message: "Invalid token." });
    }

    // 🚨 Catch-all for unexpected errors
    console.error("🔥 JWT verification failed:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
module.exports = authRefresh;
