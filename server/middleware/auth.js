const jwt = require("jsonwebtoken");
const AdminUser = require("../src/features/login-signup/model/adminUser");
const { isUnverifiedAdmin, sendAdminNotVerified } = require("../utils/adminVerification");
const { logMasterAction } = require("../src/features/master/services/auditService");

require("dotenv").config();

const auth = async (req, res, next) => {
  try {
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
    const user = await AdminUser.findById(decoded.id).select("_id accountType isVerified");
    if (!user) {
      console.log("user Not Found");

      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Unverified admins are signed out on their next request (client sees
    // code ADMIN_NOT_VERIFIED, shows an alert and logs out).
    if (isUnverifiedAdmin(user)) return sendAdminNotVerified(res);

    //  Attach user info to request
    req.userId = user._id;

    // Support mode: token minted by a master admin (see /master/.../impersonate).
    if (decoded.impersonatedBy) {
      req.impersonatedBy = decoded.impersonatedBy;
      // Audit every change a master makes inside a club's account.
      if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        res.on("finish", () => {
          logMasterAction(req, {
            action: "impersonated_write",
            masterId: decoded.impersonatedBy,
            masterEmail: decoded.impersonatedByEmail || "",
            targetAdminId: user._id,
            method: req.method,
            path: (req.originalUrl || "").split("?")[0].slice(0, 200),
            statusCode: res.statusCode,
          });
        });
      }
    }

    //  Continue to next middleware
    next();
  } catch (error) {
          console.log("Auth error",error);

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
