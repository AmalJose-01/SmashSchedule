const mongoose = require("mongoose");
const AdminUser = require("../../login-signup/model/adminUser");
const Club = require("../../../../model/club");
const svc = require("../services/masterService");
const throttle = require("../services/loginThrottle");
const { logMasterAction, clientIp } = require("../services/auditService");

const masterController = {
  login: async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const ip = clientIp(req);
    const invalid = () => res.status(400).json({ message: "Invalid username or password" });

    try {
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      if (throttle.isBlocked(ip, email)) {
        return res.status(429).json({ message: "Too many attempts. Try again in 15 minutes." });
      }

      const user = await AdminUser.findOne({ emailID: email, accountType: "master" }).select("+password");
      const ok = user && user.password ? await user.comparePassword(password) : false;
      if (!ok) {
        throttle.recordFailure(ip, email);
        logMasterAction(req, { action: "master_login_failed", masterEmail: email });
        return invalid();
      }

      throttle.clear(ip, email);
      logMasterAction(req, { action: "master_login", masterId: user._id, masterEmail: user.emailID });
      return res.status(200).json({
        message: "Login successful",
        accessToken: svc.signMasterToken(user),
        user: { id: user._id, email: user.emailID, firstName: user.firstName, lastName: user.lastName },
      });
    } catch (error) {
      console.error("master login error:", error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  me: (req, res) => res.status(200).json({ id: req.masterId, email: req.masterEmail }),

  listClubs: async (req, res) => {
    try {
      const { search, status, page, limit } = req.query;
      const data = await svc.listClubs({ search, status, page, limit });
      logMasterAction(req, {
        action: "club_list_view",
        masterId: req.masterId,
        masterEmail: req.masterEmail,
        path: req.originalUrl.slice(0, 200),
      });
      return res.status(200).json(data);
    } catch (error) {
      console.error("master listClubs error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  getClub: async (req, res) => {
    try {
      const detail = await svc.getClubDetail(req.params.adminId);
      if (!detail) return res.status(404).json({ message: "Club admin not found" });
      logMasterAction(req, {
        action: "club_view",
        masterId: req.masterId,
        masterEmail: req.masterEmail,
        targetAdminId: detail.admin.adminId,
        targetClubId: detail.club?._id || null,
      });
      return res.status(200).json(detail);
    } catch (error) {
      console.error("master getClub error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  impersonate: async (req, res) => {
    try {
      const { adminId } = req.params;
      if (!mongoose.isValidObjectId(adminId)) {
        return res.status(400).json({ message: "Invalid admin id" });
      }
      const target = await AdminUser.findOne({ _id: adminId, accountType: "admin" });
      if (!target) return res.status(404).json({ message: "Club admin not found" });

      // The normal `auth` middleware rejects unverified admins on every request,
      // so a token for one would be useless — say so up front.
      if (target.isVerified !== true) {
        return res.status(409).json({
          code: "ADMIN_NOT_VERIFIED",
          message: "This admin account isn't verified yet, so it can't be opened. Verify it first.",
        });
      }

      const club = await Club.findOne({ adminId: target._id }).select("_id name").lean();
      const { accessToken, expiresIn } = svc.signImpersonationToken(target, req);

      logMasterAction(req, {
        action: "impersonate_start",
        masterId: req.masterId,
        masterEmail: req.masterEmail,
        targetAdminId: target._id,
        targetClubId: club?._id || null,
      });

      return res.status(200).json({
        accessToken,
        expiresIn,
        club: { clubId: club?._id || null, name: club?.name || "", adminEmail: target.emailID },
      });
    } catch (error) {
      console.error("master impersonate error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};

module.exports = masterController;
