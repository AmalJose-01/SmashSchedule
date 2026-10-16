const mongoose = require("mongoose");

// Every master-admin action worth reviewing later: logins, club views,
// "enter club" (impersonation) and any write made while in support mode.
const masterAuditLogSchema = new mongoose.Schema(
  {
    masterId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", default: null },
    masterEmail: { type: String, default: "" },
    action: {
      type: String,
      required: true,
      enum: [
        "master_login",
        "master_login_failed",
        "club_list_view",
        "club_view",
        "impersonate_start",
        "impersonated_write",
      ],
    },
    targetAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", default: null },
    targetClubId: { type: mongoose.Schema.Types.ObjectId, ref: "Club", default: null },
    method: { type: String, default: "" },
    path: { type: String, default: "" },
    statusCode: { type: Number, default: null },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

masterAuditLogSchema.index({ createdAt: -1 });
masterAuditLogSchema.index({ targetAdminId: 1, createdAt: -1 });

module.exports = mongoose.model("MasterAuditLog", masterAuditLogSchema);
