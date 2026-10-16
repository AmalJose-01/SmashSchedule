const MasterAuditLog = require("../model/MasterAuditLog");

const clientIp = (req) =>
  (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.ip || "";

// Fire-and-forget: an audit-write failure must never break the request.
const logMasterAction = (req, fields) => {
  MasterAuditLog.create({
    ip: clientIp(req),
    userAgent: String(req.headers["user-agent"] || "").slice(0, 300),
    ...fields,
  }).catch((err) => console.error("master audit log failed:", err.message));
};

module.exports = { logMasterAction, clientIp };
